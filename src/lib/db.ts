import Dexie, { type EntityTable } from "dexie";

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  examTimeMinutes: number;
  examQuestionCount: number;
  examFormat: string;
  examFormatNotes: string;
  oldExamTexts: string[];
  examExamples: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PDFRecord {
  id: string;
  name: string;
  fileSize: number;
  pageCount: number;
  extractedText: string;
  pageTexts: string[];
  images: { pageNumber: number; dataUrl: string }[];
  thumbnailDataUrl: string;
  pdfBlob: Blob;
  projectId?: string;
  pdfType: "lecture" | "old_exam";
  createdAt: Date;
}

export interface Question {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "fill_in_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  context?: string;
  source?: string;
}

export interface TestRecord {
  id: string;
  pdfId: string;
  pdfName: string;
  title: string;
  questions: Question[];
  answers: Record<string, string>;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  difficulty: string;
  language: string;
  model: string;
  timeSpentSeconds: number;
  status: "in_progress" | "completed";
  projectId?: string;
  pdfIds?: string[];
  mode: "practice" | "exam_simulation";
  timeLimitSeconds?: number;
  autoSubmitted?: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface SettingsRecord {
  id: string;
  language: string;
  difficulty: string;
  model: string;
  questionsPerTest: number;
}

const db = new Dexie("StarkDB") as Dexie & {
  projects: EntityTable<ProjectRecord, "id">;
  pdfs: EntityTable<PDFRecord, "id">;
  tests: EntityTable<TestRecord, "id">;
  settings: EntityTable<SettingsRecord, "id">;
};

db.version(1).stores({
  pdfs: "id, name, createdAt",
  tests: "id, pdfId, status, createdAt",
  settings: "id",
});

db.version(2)
  .stores({
    projects: "id, name, createdAt",
    pdfs: "id, name, createdAt, projectId, pdfType",
    tests: "id, pdfId, status, createdAt, projectId, mode",
    settings: "id",
  })
  .upgrade((tx) => {
    tx.table("pdfs")
      .toCollection()
      .modify((pdf) => {
        if (!pdf.pdfType) pdf.pdfType = "lecture";
      });
    tx.table("tests")
      .toCollection()
      .modify((test) => {
        if (!test.mode) test.mode = "practice";
      });
  });

db.version(3)
  .stores({
    projects: "id, name, createdAt",
    pdfs: "id, name, createdAt, projectId, pdfType",
    tests: "id, pdfId, status, createdAt, projectId, mode",
    settings: "id",
  })
  .upgrade((tx) => {
    tx.table("pdfs")
      .toCollection()
      .modify((pdf) => {
        if (!pdf.pageTexts) {
          // Split existing extractedText into a single-element array as fallback
          pdf.pageTexts = pdf.extractedText ? [pdf.extractedText] : [];
        }
      });
  });

export { db };
