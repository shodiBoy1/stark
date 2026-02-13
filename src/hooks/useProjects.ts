"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type ProjectRecord } from "@/lib/db";

export function useProjects() {
  const projects = useLiveQuery(() =>
    db.projects.orderBy("createdAt").reverse().toArray()
  );

  async function addProject(project: ProjectRecord) {
    await db.projects.add(project);
    return project.id;
  }

  async function updateProject(id: string, updates: Partial<Omit<ProjectRecord, "id">>) {
    await db.projects.update(id, { ...updates, updatedAt: new Date() });
  }

  async function deleteProject(id: string) {
    await db.transaction("rw", [db.projects, db.pdfs, db.tests], async () => {
      await db.projects.delete(id);
      // Unlink PDFs (don't delete — keep them in library)
      await db.pdfs.where("projectId").equals(id).modify({ projectId: undefined });
      // Delete project tests
      await db.tests.where("projectId").equals(id).delete();
    });
  }

  async function getProject(id: string) {
    return db.projects.get(id);
  }

  return { projects, addProject, updateProject, deleteProject, getProject };
}

export function useProject(id: string) {
  const project = useLiveQuery(() => db.projects.get(id), [id]);
  return project;
}

export function useProjectPDFs(projectId: string) {
  const pdfs = useLiveQuery(
    () => db.pdfs.where("projectId").equals(projectId).toArray(),
    [projectId]
  );
  return pdfs;
}

export function useProjectTests(projectId: string) {
  const tests = useLiveQuery(
    () => db.tests.where("projectId").equals(projectId).reverse().sortBy("createdAt"),
    [projectId]
  );
  return tests;
}
