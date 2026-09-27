export interface SourcePages {
  name: string;
  pages: string[];
}

interface ExcerptPage {
  source: string;
  page: number;
  text: string;
}

const MIN_PAGE_CHARS = 40;

export function collectReadablePages(sources: SourcePages[]): ExcerptPage[] {
  const pages: ExcerptPage[] = [];
  for (const source of sources) {
    source.pages.forEach((text, index) => {
      const cleaned = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (cleaned.length < MIN_PAGE_CHARS) return;
      pages.push({ source: source.name, page: index + 1, text: cleaned });
    });
  }
  return pages;
}

function splitWindows<T>(items: T[], batches: number): T[][] {
  if (items.length === 0) return [];
  if (batches <= 1) return [items];
  const size = Math.ceil(items.length / batches);
  const windows: T[][] = [];
  for (let i = 0; i < batches; i++) {
    const slice = items.slice(i * size, (i + 1) * size);
    windows.push(slice.length > 0 ? slice : [items[items.length - 1]]);
  }
  return windows;
}

function evenSample<T>(items: T[], count: number): T[] {
  if (count >= items.length) return items;
  if (count <= 1) return [items[Math.floor((items.length - 1) / 2)]];
  const sample: T[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.round((i * (items.length - 1)) / (count - 1));
    sample.push(items[index]);
  }
  return sample;
}

function formatPage(page: ExcerptPage): string {
  return `--- Source: "${page.source}" · Page ${page.page} ---\n${page.text}`;
}

function fitBudget(pages: ExcerptPage[], budget: number): string {
  const full = pages.map(formatPage).join("\n\n");
  if (full.length <= budget) return full;

  for (let count = pages.length - 1; count >= 1; count--) {
    const text = evenSample(pages, count).map(formatPage).join("\n\n");
    if (text.length <= budget) return text;
  }

  return formatPage(pages[0]).slice(0, budget);
}

/**
 * Pick a page window for this generation batch so later batches cover later
 * parts of the lecture instead of repeating the opening pages.
 */
export function buildBatchExcerpt(
  sources: SourcePages[],
  batchIndex: number,
  totalBatches: number,
  budget: number,
): string {
  const pages = collectReadablePages(sources);
  if (pages.length === 0 || budget <= 0) return "";

  const batches = Math.max(1, totalBatches);
  const index = Math.min(Math.max(0, batchIndex), batches - 1);
  const windows = splitWindows(pages, batches);
  let window = windows[index] ?? pages;

  if (index > 0) {
    const previous = windows[index - 1];
    const overlap = previous?.[previous.length - 1];
    if (overlap && !window.some((page) => page.source === overlap.source && page.page === overlap.page)) {
      window = [overlap, ...window];
    }
  }

  return fitBudget(window, budget);
}

export function pagesForGeneration(pdf: {
  name: string;
  pageTexts?: string[];
  extractedText?: string;
}): SourcePages {
  const named = pdf.name.replace(/\.pdf$/i, "");
  if (pdf.pageTexts && pdf.pageTexts.length > 0) {
    return {
      name: named,
      pages: pdf.pageTexts.slice(0, 120).map((page) => (page || "").slice(0, 8000)),
    };
  }

  const text = pdf.extractedText || "";
  const pages: string[] = [];
  const size = 1600;
  for (let i = 0; i < text.length && pages.length < 120; i += size) {
    pages.push(text.slice(i, i + size));
  }
  return { name: named, pages: pages.length > 0 ? pages : [""] };
}
