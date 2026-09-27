import assert from "node:assert/strict";
import test from "node:test";
import { normalizeQuestions } from "./questions";
import { extractJsonValue, questionsFromPayload } from "./parse-model-json";
import { questionsArraySchema } from "./schemas";

test("choice questions map a bare letter onto the matching option", () => {
  const questions = normalizeQuestions(
    [
      {
        type: "multiple_choice",
        question: "Which process moves water across a membrane?",
        options: ["A) Osmosis", "B) Transcription", "C) Translation", "D) Splicing"],
        correctAnswer: "A",
        explanation: "The excerpt defines osmosis as water movement.",
        source: "Bio",
        page: 3,
      },
    ],
    "mc_4",
    10,
  );
  assert.equal(questions.length, 1);
  assert.equal(questions[0].correctAnswer, "A) Osmosis");
  assert.equal(questions[0].page, 3);
  assert.equal(questions[0].id, "q1");
  assert.equal(questionsArraySchema.parse(questions)[0].correctAnswer, "A) Osmosis");
});

test("true or false keeps the matching option when the pair is swapped", () => {
  const questions = normalizeQuestions(
    [
      {
        type: "true_false",
        question: "Starch is a polysaccharide.",
        options: ["Falsch", "Wahr"],
        correctAnswer: "Wahr",
        explanation: "The page lists starch as a polysaccharide.",
      },
    ],
    "mixed",
    10,
  );
  assert.equal(questions[0].correctAnswer, "Wahr");
});

test("short answers keep distinct accepted answers", () => {
  const questions = normalizeQuestions(
    [
      {
        type: "short_answer",
        question: "Name the organelle that produces ATP.",
        correctAnswer: "mitochondria",
        acceptedAnswers: ["mitochondria", "the mitochondrion"],
        explanation: "Shown in the cell diagram.",
      },
    ],
    "mixed",
    10,
  );
  assert.deepEqual(questions[0].acceptedAnswers, ["the mitochondrion"]);
  assert.equal(questions[0].options, undefined);
});

test("invalid questions are dropped", () => {
  const questions = normalizeQuestions(
    [{ type: "multiple_choice", question: "Too short", options: ["A) a"], correctAnswer: "A) a" }],
    "mc_4",
    10,
  );
  assert.equal(questions.length, 0);
});

test("truncated model JSON can still be read", () => {
  const raw = '{"questions":[{"type":"short_answer","question":"What is ATP?","correctAnswer":"energy"}]';
  const payload = questionsFromPayload(extractJsonValue(raw));
  assert.equal(Array.isArray(payload), true);
  assert.equal((payload[0] as { correctAnswer: string }).correctAnswer, "energy");
});
