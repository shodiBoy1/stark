"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePDFs } from "@/hooks/usePDFs";
import { useTests } from "@/hooks/useTests";
import { useProjects } from "@/hooks/useProjects";
import { DEFAULT_SETTINGS, LANGUAGES, DIFFICULTIES, MODELS, TEST_MODES, EXAM_FORMATS, MAX_QUESTIONS, QUESTIONS_PER_BATCH } from "@/lib/constants";
import { generateInBatches } from "@/lib/generate";
import type { PDFRecord, TestRecord } from "@/lib/db";

function NewTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPdfId = searchParams.get("pdfId");
  const preselectedProjectId = searchParams.get("projectId");

  const { pdfs } = usePDFs();
  const { projects } = useProjects();
  const { addTest } = useTests();

  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId || "");
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>(
    preselectedPdfId ? [preselectedPdfId] : []
  );
  const [difficulty, setDifficulty] = useState<string>(DEFAULT_SETTINGS.difficulty);
  const [language, setLanguage] = useState<string>(DEFAULT_SETTINGS.language);
  const [model, setModel] = useState<string>(DEFAULT_SETTINGS.model);
  const [questionsCount, setQuestionsCount] = useState(DEFAULT_SETTINGS.questionsPerTest);
  const [testMode, setTestMode] = useState<"practice" | "exam_simulation">("practice");
  const [examMinutes, setExamMinutes] = useState(90);
  const [examFormat, setExamFormat] = useState<string>("mixed_fill");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    if (preselectedPdfId && !selectedPdfIds.includes(preselectedPdfId)) {
      setSelectedPdfIds([preselectedPdfId]);
    }
  }, [preselectedPdfId]);

  // When a project is selected, auto-load its lecture PDFs and config
  useEffect(() => {
    if (selectedProject && pdfs) {
      const projectLecturePDFs = pdfs.filter(
        (p) => p.projectId === selectedProject.id && p.pdfType === "lecture"
      );
      setSelectedPdfIds(projectLecturePDFs.map((p) => p.id));
      setQuestionsCount(selectedProject.examQuestionCount);
      if (selectedProject.examFormat) setExamFormat(selectedProject.examFormat);
      if (selectedProject.examTimeMinutes > 0) {
        setTestMode("exam_simulation");
        setExamMinutes(selectedProject.examTimeMinutes);
      }
    }
  }, [selectedProjectId, pdfs]);

  // Available PDFs — either all or filtered by project
  const availablePDFs = selectedProjectId
    ? pdfs?.filter((p) => p.projectId === selectedProjectId && p.pdfType === "lecture")
    : pdfs?.filter((p) => p.pdfType !== "old_exam");

  const selectedPDFObjects = pdfs?.filter((p) => selectedPdfIds.includes(p.id)) || [];

  function togglePdf(pdfId: string) {
    setSelectedPdfIds((prev) =>
      prev.includes(pdfId) ? prev.filter((id) => id !== pdfId) : [...prev, pdfId]
    );
  }

  async function handleGenerate() {
    if (selectedPDFObjects.length === 0) {
      toast.error("Please select at least one PDF");
      return;
    }

    setIsGenerating(true);
    setBatchProgress({ completed: 0, total: Math.ceil(questionsCount / QUESTIONS_PER_BATCH) });

    try {
      const texts = selectedPDFObjects.map((p) => p.extractedText);
      const pdfName = selectedPDFObjects.map((p) => p.name.replace(".pdf", "")).join(", ");

      // Build exam context from project
      let examContext: string | undefined;
      if (selectedProject) {
        const parts: string[] = [];
        if (selectedProject.oldExamTexts.length > 0) {
          parts.push("OLD EXAM CONTENT:\n" + selectedProject.oldExamTexts.join("\n---\n"));
        }
        if (selectedProject.examExamples.length > 0) {
          parts.push("EXAM EXAMPLES:\n" + selectedProject.examExamples.join("\n---\n"));
        }
        if (selectedProject.examFormatNotes) {
          parts.push("FORMAT NOTES: " + selectedProject.examFormatNotes);
        }
        if (parts.length > 0) examContext = parts.join("\n\n");
      }

      const questions = await generateInBatches({
        texts,
        difficulty,
        language,
        model,
        questionsCount,
        pdfName,
        examFormat,
        examContext,
        instructions: customInstructions.trim() || undefined,
        onProgress: (completed, total) => setBatchProgress({ completed, total }),
      });

      const timeLimitSeconds =
        testMode === "exam_simulation" && examMinutes > 0
          ? examMinutes * 60
          : undefined;

      const test: TestRecord = {
        id: crypto.randomUUID(),
        pdfId: selectedPDFObjects[0].id,
        pdfName: pdfName,
        title: selectedProject
          ? `${selectedProject.name} - ${difficulty} ${testMode === "exam_simulation" ? "exam" : "test"}`
          : `${pdfName} - ${difficulty} test`,
        questions,
        answers: {},
        score: 0,
        totalCorrect: 0,
        totalQuestions: questions.length,
        difficulty,
        language,
        model,
        timeSpentSeconds: 0,
        status: "in_progress",
        projectId: selectedProjectId || undefined,
        pdfIds: selectedPdfIds,
        mode: testMode,
        timeLimitSeconds,
        createdAt: new Date(),
      };

      await addTest(test);
      toast.success("Test generated successfully!");
      router.push(`/tests/${test.id}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to generate test");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isGenerating) {
    const totalBatches = batchProgress.total;
    const progressPct = totalBatches > 0 ? (batchProgress.completed / totalBatches) * 100 : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card p-12 text-center space-y-4 max-w-md w-full">
          <Loader2 size={48} className="text-accent-soft animate-spin mx-auto" />
          <h2 className="text-xl font-semibold text-text">Generating your test...</h2>
          <p className="text-sm text-muted">
            AI is creating {questionsCount} questions
            {totalBatches > 1 && ` (batch ${batchProgress.completed + 1} of ${totalBatches})`}
          </p>
          {totalBatches > 1 && (
            <div className="space-y-2">
              <Progress value={progressPct} />
              <p className="text-xs text-muted">
                {batchProgress.completed} of {totalBatches} batches complete
              </p>
            </div>
          )}
          <p className="text-xs text-muted">This may take 15-60 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/tests"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Tests
      </Link>

      <PageHeader
        title="Generate New Test"
        description="Configure and generate an AI-powered test from your PDFs"
      />

      <GlassCard className="p-6 max-w-xl space-y-6">
        {/* Project Selector */}
        {projects && projects.length > 0 && (
          <Select
            label="Project (optional)"
            id="project"
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              if (!e.target.value) setSelectedPdfIds([]);
            }}
            options={[
              { value: "", label: "No project — select PDFs manually" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        )}

        {/* PDF Selection */}
        <div className="space-y-1.5">
          <label className="text-sm text-muted-strong font-medium">Source PDFs</label>
          {!availablePDFs || availablePDFs.length === 0 ? (
            <p className="text-sm text-muted">
              {selectedProjectId
                ? "No lecture PDFs in this project. Add some in the project page."
                : "No PDFs available. Upload some in the Library."}
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availablePDFs.map((pdf: PDFRecord) => (
                <label
                  key={pdf.id}
                  className={`flex items-center gap-3 p-3 rounded-[12px] border cursor-pointer transition-all ${
                    selectedPdfIds.includes(pdf.id)
                      ? "bg-accent/5 border-accent/30"
                      : "bg-white border-card-border hover:bg-card-hover"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPdfIds.includes(pdf.id)}
                    onChange={() => togglePdf(pdf.id)}
                    className="accent-[#B8A9C9]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text truncate">{pdf.name}</p>
                    <p className="text-xs text-muted">
                      {pdf.pageCount} pages, {pdf.extractedText.length.toLocaleString()} chars
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {selectedPDFObjects.length > 0 && (
            <p className="text-xs text-muted mt-1">
              {selectedPDFObjects.length} PDF{selectedPDFObjects.length > 1 ? "s" : ""} selected
              ({selectedPDFObjects.reduce((s, p) => s + p.extractedText.length, 0).toLocaleString()} total chars)
            </p>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="space-y-1.5">
          <label className="text-sm text-muted-strong font-medium">Test Mode</label>
          <div className="flex gap-2">
            {TEST_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setTestMode(m.value as "practice" | "exam_simulation")}
                className={`flex-1 p-3 rounded-[12px] text-sm border transition-all cursor-pointer ${
                  testMode === m.value
                    ? "bg-accent/5 border-accent/30 text-text"
                    : "bg-white border-card-border text-muted hover:bg-card-hover"
                }`}
              >
                <p className="font-medium">{m.label}</p>
                <p className="text-xs mt-0.5 text-muted">{m.description}</p>
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Question Format"
          id="examFormat"
          value={examFormat}
          onChange={(e) => setExamFormat(e.target.value)}
          options={EXAM_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
        />

        <Select
          label="Difficulty"
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          options={DIFFICULTIES.map((d) => ({ value: d.value, label: `${d.label} - ${d.description}` }))}
        />

        <Select
          label="Language"
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
        />

        <Select
          label="AI Model"
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          options={MODELS.map((m) => ({ value: m.value, label: m.label }))}
        />

        <div className="space-y-1.5">
          <label htmlFor="count" className="text-sm text-muted-strong font-medium">
            Number of Questions
          </label>
          <input
            type="range"
            id="count"
            min={5}
            max={MAX_QUESTIONS}
            step={1}
            value={questionsCount}
            onChange={(e) => setQuestionsCount(Number(e.target.value))}
            className="w-full accent-[#B8A9C9]"
          />
          <div className="flex justify-between text-xs text-muted">
            <span>5</span>
            <span className="text-text font-medium">
              {questionsCount} questions
              {questionsCount > QUESTIONS_PER_BATCH &&
                ` (${Math.ceil(questionsCount / QUESTIONS_PER_BATCH)} batches)`}
            </span>
            <span>{MAX_QUESTIONS}</span>
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-1.5">
          <label htmlFor="instructions" className="text-sm text-muted-strong font-medium">
            Custom Instructions (optional)
          </label>
          <textarea
            id="instructions"
            placeholder={"e.g. 7 questions from PDF \"Thema 1\", 6 questions from PDF \"Data Values\", all multiple choice with 4 options..."}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            className="w-full bg-white border border-card-border rounded-[12px] px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-colors resize-none"
          />
          <p className="text-xs text-muted">
            Give specific instructions to the AI — question distribution per PDF, format requirements, etc. Leave empty for defaults.
          </p>
        </div>

        {testMode === "exam_simulation" && (
          <div className="space-y-1.5">
            <label htmlFor="examMinutes" className="text-sm text-muted-strong font-medium">
              Time Limit (minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="examMinutes"
                min={1}
                max={300}
                value={examMinutes}
                onChange={(e) => setExamMinutes(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-white border border-card-border rounded-[12px] px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-colors"
              />
              <span className="text-sm text-muted">minutes — auto-submit when time runs out</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          size="lg"
          className="w-full"
          disabled={selectedPdfIds.length === 0}
        >
          <Sparkles size={18} />
          Generate Test
        </Button>
      </GlassCard>
    </div>
  );
}

export default function NewTestPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full max-w-xl" />
        </div>
      }
    >
      <NewTestContent />
    </Suspense>
  );
}
