function repairTruncatedJson(input: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inString) {
      if (escape) escape = false;
      else if (char === "\\") escape = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{" || char === "[") stack.push(char);
    else if ((char === "}" || char === "]") && stack.length > 0) {
      stack.pop();
      if (stack.length === 0) return input.slice(0, i + 1);
    }
  }

  let out = input;
  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  while (stack.length > 0) {
    const open = stack.pop();
    out += open === "{" ? "}" : "]";
  }
  return out;
}

export function extractJsonValue(raw: string): unknown {
  const withoutFence = raw
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    // The model sometimes wraps the object in prose.
  }

  const objectStart = withoutFence.indexOf("{");
  const arrayStart = withoutFence.indexOf("[");
  const start =
    objectStart === -1 ? arrayStart : arrayStart === -1 ? objectStart : Math.min(objectStart, arrayStart);
  if (start === -1) {
    throw new Error("Model response did not contain JSON");
  }

  const slice = withoutFence.slice(start);
  try {
    return JSON.parse(slice);
  } catch {
    return JSON.parse(repairTruncatedJson(slice));
  }
}

export function questionsFromPayload(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "questions" in value) {
    const questions = (value as { questions?: unknown }).questions;
    if (Array.isArray(questions)) return questions;
  }
  if (value && typeof value === "object" && "pages" in value) {
    const pages = (value as { pages?: unknown }).pages;
    if (Array.isArray(pages)) return pages;
  }
  throw new Error("JSON did not contain a questions array");
}
