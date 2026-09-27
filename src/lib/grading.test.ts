import assert from "node:assert/strict";
import test from "node:test";
import { gradeTest, isAnswerCorrect } from "./grading";
import type { Question } from "./db";

function question(partial: Partial<Question> & Pick<Question, "type" | "correctAnswer">): Question {
  return {
    id: "q1",
    question: "Sample?",
    explanation: "",
    ...partial,
  };
}

test("multiple choice accepts the option text without requiring the letter prefix", () => {
  const q = question({
    type: "multiple_choice",
    options: ["A) Osmosis", "B) Diffusion"],
    correctAnswer: "A) Osmosis",
  });
  assert.equal(isAnswerCorrect(q, "A) Osmosis"), true);
  assert.equal(isAnswerCorrect(q, "Osmosis"), true);
  assert.equal(isAnswerCorrect(q, "A"), true);
  assert.equal(isAnswerCorrect(q, "B) Diffusion"), false);
});

test("short answers accept the key term and listed alternatives", () => {
  const q = question({
    type: "short_answer",
    correctAnswer: "die Mitochondrien",
    acceptedAnswers: ["powerhouse of the cell"],
  });
  assert.equal(isAnswerCorrect(q, "Mitochondrien"), true);
  assert.equal(isAnswerCorrect(q, "Powerhouse of the cell"), true);
  assert.equal(isAnswerCorrect(q, "nucleus"), false);
  assert.equal(isAnswerCorrect(q, ""), false);
});

test("german spelling matches after normalization", () => {
  const q = question({ type: "short_answer", correctAnswer: "Wärme" });
  assert.equal(isAnswerCorrect(q, "wärme"), true);
});

test("gradeTest counts blanks as incorrect", () => {
  const questions = [
    question({ id: "q1", type: "true_false", options: ["True", "False"], correctAnswer: "True" }),
    question({ id: "q2", type: "short_answer", correctAnswer: "ATP" }),
  ];
  const graded = gradeTest(questions, { q1: "True" });
  assert.deepEqual(graded, { score: 50, totalCorrect: 1 });
});
