# STARK Architecture

Technical architecture document for STARK, an AI-powered exam preparation tool.

## Overview

STARK is a self-hosted Next.js 16 application. All user data is stored client-side in IndexedDB (via Dexie.js). The server handles PDF processing (Python subprocess) and AI generation (OpenAI/Anthropic API calls). No user data is persisted on the server.

## Data Flow

```
User uploads PDF
       |
       v
[Next.js API Route: /api/pdf/upload]
       |
       v
[Python subprocess: scripts/render_pages.py]
  - Uses pypdfium2 to extract text + render pages to JPEG
       |
       v
[Check text quality: avg chars/page >= 100?]
  - YES -> Use basic extracted text (fast path, sub-second)
  - NO  -> Send page images to OpenAI Vision (gpt-4o-mini) for OCR
       |
       v
[Return extracted text + page count to client]
       |
       v
[Client stores PDF + text in IndexedDB via Dexie.js]
```

## PDF Processing Pipeline

1. User uploads PDF via browser.
2. File sent to `/api/pdf/upload` API route.
3. Saved to temp file, then Python subprocess (`scripts/render_pages.py`) runs:
   - pypdfium2 extracts text per page.
   - pypdfium2 renders each page to JPEG (base64).
4. If avg chars/page >= 100, the PDF is text-heavy. Use extracted text directly.
5. If avg chars/page < 100, the PDF is scanned or image-based. Send images to OpenAI Vision in batches of 3 pages.
6. Vision OCR has retry logic with rate limit handling (reads `x-ratelimit-remaining-tokens` headers).
7. Rescan endpoint (`/api/pdf/rescan`) always runs Vision OCR for full re-extraction.

## Test Generation Pipeline

1. User selects PDFs, difficulty, language, model, and question count.
2. Client calls `generateInBatches()` which splits into batches of 22 questions.
3. Each batch calls `/api/generate` API route.
4. Server builds prompt with:
   - Source text (up to 40K chars, split across sources).
   - Difficulty instructions (Bloom's taxonomy levels).
   - Language instructions.
   - Exam context from old exams (if the project has old exams).
   - Custom instructions (if provided).
   - Previously generated questions (for deduplication).
5. Sends to OpenAI (gpt-4o-mini) or Anthropic (claude-sonnet-4-5) based on user choice.
6. Response parsed as JSON array, validated with Zod schema.
7. Client deduplicates across batches using Jaccard word similarity (threshold: 0.7).
8. Questions stored in IndexedDB with the test record.

## IndexedDB Schema (Dexie v3)

### projects

Indexed by: `id`, `name`, `createdAt`

Fields:
- `id` -- primary key
- `name` -- project name
- `description` -- project description
- `examTimeMinutes` -- expected exam duration
- `examQuestionCount` -- expected number of exam questions
- `examFormat` -- exam format type
- `examFormatNotes` -- additional format notes
- `oldExamTexts` -- text from previous exams (used for context)
- `examExamples` -- example questions from old exams
- `createdAt`, `updatedAt` -- timestamps

### pdfs

Indexed by: `id`, `name`, `createdAt`, `projectId`, `pdfType`

Fields:
- `id` -- primary key
- `name` -- file name
- `fileSize` -- size in bytes
- `pageCount` -- number of pages
- `extractedText` -- full extracted text
- `pageTexts` -- per-page extracted text
- `images` -- rendered page images (base64 JPEG)
- `thumbnailDataUrl` -- thumbnail for UI display
- `pdfBlob` -- original PDF binary
- `projectId` -- foreign key to projects table
- `pdfType` -- type classification
- `createdAt` -- timestamp

### tests

Indexed by: `id`, `pdfId`, `status`, `createdAt`, `projectId`, `mode`

Fields:
- `id` -- primary key
- `pdfId` -- legacy single-PDF foreign key
- `pdfName` -- display name
- `title` -- test title
- `questions` -- generated question objects
- `answers` -- user answer records
- `score` -- percentage score
- `totalCorrect` -- number of correct answers
- `totalQuestions` -- total number of questions
- `difficulty` -- difficulty level used
- `language` -- language used
- `model` -- AI model used
- `timeSpentSeconds` -- time user spent
- `status` -- test status (in-progress, completed, etc.)
- `projectId` -- foreign key to projects table
- `pdfIds` -- array of PDF IDs (multi-source tests)
- `mode` -- test mode
- `timeLimitSeconds` -- optional time limit
- `autoSubmitted` -- whether test was auto-submitted on timeout
- `createdAt`, `completedAt` -- timestamps

### settings

Indexed by: `id`

Fields:
- `id` -- primary key
- `language` -- preferred language
- `difficulty` -- preferred difficulty
- `model` -- preferred AI model
- `questionsPerTest` -- default question count

## API Routes

### POST /api/pdf/upload

Upload and extract PDF text. Accepts a PDF file, saves to temp, runs Python extraction, and returns extracted text plus page count.

### POST /api/pdf/rescan

Re-extract PDF with full Vision OCR. Always sends page images to OpenAI Vision regardless of text quality, for cases where initial extraction was insufficient.

### POST /api/generate

Generate test questions from source text. Accepts source text, configuration (difficulty, language, model, question count), and optional context (old exams, custom instructions, previous questions). Returns a validated JSON array of question objects.

## Key Libraries

| Library | Purpose |
|---|---|
| Next.js 16 | App Router, React 19, server-side API routes |
| Dexie.js | IndexedDB wrapper for client-side storage |
| pypdfium2 | PDF text extraction and page rendering (Python) |
| OpenAI SDK | GPT-4o Mini for generation, Vision for OCR |
| Anthropic SDK | Claude Sonnet as alternative AI model |
| Zod | Runtime validation for API requests and responses |
| Recharts | Analytics charts |
| Tailwind CSS 4 | Styling with custom design tokens |
| Sonner | Toast notifications |

## Directory Structure

```
src/
  app/
    (app)/              -- Protected app pages (dashboard, library, tests, etc.)
    api/
      generate/         -- AI test generation endpoint
      pdf/
        upload/         -- PDF upload + text extraction
        rescan/         -- PDF re-extraction with OCR
    layout.tsx          -- Root layout
    globals.css         -- Global styles + Tailwind
  components/
    layout/             -- Sidebar, AppShell
    results/            -- Test results components
    ...                 -- Feature-specific components
  hooks/                -- Custom hooks (useProjects, usePDFs, useTests, useSettings, useStats)
  lib/
    db.ts               -- Dexie database schema
    constants.ts        -- App constants and types
    generate.ts         -- Batch generation logic with dedup
    prompts.ts          -- AI prompt builder
    schemas.ts          -- Zod validation schemas
    utils.ts            -- Utility functions
scripts/
  render_pages.py       -- PDF to text + JPEG extraction
  setup.sh              -- Automated Python venv setup script
```

## Security Considerations

- All user data remains in the browser (IndexedDB). Nothing is stored server-side.
- API keys for OpenAI and Anthropic must be configured as environment variables on the server.
- PDF files are written to temp storage during processing and are not retained after extraction completes.
- The application is designed for self-hosting. There is no multi-tenant authentication layer.
