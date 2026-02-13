"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { formatDate } from "@/lib/utils";
import type { ProjectRecord } from "@/lib/db";

export default function ProjectsPage() {
  const { projects, addProject, deleteProject } = useProjects();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectRecord | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const project: ProjectRecord = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: newDescription.trim(),
      examTimeMinutes: 60,
      examQuestionCount: 20,
      examFormat: "mixed",
      examFormatNotes: "",
      oldExamTexts: [],
      examExamples: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addProject(project);
    toast.success("Project created");
    setShowNewDialog(false);
    setNewName("");
    setNewDescription("");
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Organize your courses and exam preparation"
        action={
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus size={16} />
            New Project
          </Button>
        }
      />

      {projects === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create a project to organize your course materials and generate exam-style tests"
          action={
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus size={16} />
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <GlassCard key={project.id} hover className="group">
              <Link href={`/projects/${project.id}`} className="block p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <FolderOpen size={20} className="text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-text truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>{project.examFormat}</Badge>
                      <span className="text-xs text-muted">{project.examTimeMinutes}min</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted shrink-0 mt-1" />
                </div>
              </Link>
              <div className="px-5 pb-3 flex items-center justify-between">
                <p className="text-xs text-muted">{formatDate(project.createdAt)}</p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget(project);
                  }}
                  aria-label="Delete project"
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 text-muted hover:text-error transition-all duration-200 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewDialog} onClose={() => setShowNewDialog(false)} title="New Project">
        <div className="space-y-4">
          <Input
            label="Project Name"
            id="project-name"
            placeholder="e.g. Linear Algebra, Organic Chemistry"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="space-y-1.5">
            <label htmlFor="project-desc" className="text-sm text-muted-strong font-medium">
              Description (optional)
            </label>
            <textarea
              id="project-desc"
              placeholder="Course description or notes..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className="w-full bg-white border border-card-border rounded-[12px] px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-colors duration-200 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Project</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Project"
        description={<>Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? PDFs will be kept in your library but project tests will be deleted.</>}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteProject(deleteTarget.id);
            toast.success("Project deleted");
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
