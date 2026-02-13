"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type TestRecord, type Question } from "@/lib/db";
import { normalizeText } from "@/lib/utils";

export function useTests(projectId?: string) {
  const tests = useLiveQuery(() => {
    if (projectId) {
      return db.tests.where("projectId").equals(projectId).reverse().sortBy("createdAt");
    }
    return db.tests.orderBy("createdAt").reverse().toArray();
  }, [projectId]);

  async function addTest(test: TestRecord) {
    await db.tests.add(test);
    return test.id;
  }

  async function getTest(id: string) {
    return db.tests.get(id);
  }

  async function updateAnswer(testId: string, questionId: string, answer: string) {
    await db.transaction("rw", db.tests, async () => {
      const test = await db.tests.get(testId);
      if (!test) return;
      await db.tests.update(testId, {
        answers: { ...test.answers, [questionId]: answer },
      });
    });
  }

  async function submitTest(testId: string, timeSpentSeconds: number, autoSubmitted?: boolean) {
    const test = await db.tests.get(testId);
    if (!test) return;

    let totalCorrect = 0;
    for (const q of test.questions) {
      const userAnswer = test.answers[q.id];
      if (isCorrect(q, userAnswer)) {
        totalCorrect++;
      }
    }

    const score = Math.round((totalCorrect / test.totalQuestions) * 100);

    await db.tests.update(testId, {
      status: "completed",
      score,
      totalCorrect,
      timeSpentSeconds,
      autoSubmitted: autoSubmitted || false,
      completedAt: new Date(),
    });

    return { score, totalCorrect };
  }

  async function deleteTest(id: string) {
    await db.tests.delete(id);
  }

  return { tests, addTest, getTest, updateAnswer, submitTest, deleteTest };
}

export function useTest(id: string) {
  const test = useLiveQuery(() => db.tests.get(id), [id]);
  return test;
}

function isCorrect(question: Question, userAnswer: string | undefined): boolean {
  if (!userAnswer) return false;
  return normalizeText(userAnswer) === normalizeText(question.correctAnswer);
}
