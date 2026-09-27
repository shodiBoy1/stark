import assert from "node:assert/strict";
import test from "node:test";
import { buildBatchExcerpt, pagesForGeneration } from "./source-text";

function page(label: string): string {
  return `${label} `.repeat(30).trim();
}

test("later batches use later pages", () => {
  const sources = [
    {
      name: "Lecture",
      pages: [page("alpha"), page("beta"), page("gamma"), page("delta")],
    },
  ];
  const first = buildBatchExcerpt(sources, 0, 2, 20_000);
  const second = buildBatchExcerpt(sources, 1, 2, 20_000);
  assert.match(first, /Page 1/);
  assert.match(first, /alpha/);
  assert.match(second, /Page 4/);
  assert.match(second, /delta/);
  assert.doesNotMatch(first, /Page 4/);
});

test("empty pages keep their numbers", () => {
  const sources = [{ name: "Slides", pages: ["", page("mitosis"), ""] }];
  const excerpt = buildBatchExcerpt(sources, 0, 1, 20_000);
  assert.match(excerpt, /Page 2/);
  assert.match(excerpt, /mitosis/);
});

test("budget keeps a shorter excerpt", () => {
  const sources = [{ name: "Notes", pages: [page("one"), page("two"), page("three"), page("four")] }];
  const excerpt = buildBatchExcerpt(sources, 0, 1, 120);
  assert.ok(excerpt.length <= 120);
  assert.match(excerpt, /Page /);
});

test("pagesForGeneration preserves page slots and falls back to chunks", () => {
  const fromPages = pagesForGeneration({
    name: "Topic.pdf",
    pageTexts: ["", "hello world ".repeat(8)],
    extractedText: "ignored",
  });
  assert.equal(fromPages.name, "Topic");
  assert.equal(fromPages.pages.length, 2);

  const fromText = pagesForGeneration({
    name: "Plain.pdf",
    extractedText: "word ".repeat(2000),
  });
  assert.ok(fromText.pages.length > 1);
});
