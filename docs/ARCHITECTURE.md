# STARK Architecture

Technical architecture document for STARK, an AI-powered exam preparation tool.

## Overview

STARK is a Next.js 16 app you run on your own machine. Fork it, add your own model API key, and generate practice exams from your lecture PDFs. PDFs and test attempts are kept in the browser with Dexie.js so there is no database to set up. Reading a PDF and generating questions sends that lecture text (and page images, when a page has little selectable text) to the model provider for the key you configured.

## Data Flow

```
User uploads PDF
       |
       v
[Next.js API Route: /api/pdf/upload]
       |
       v
[Python subprocess: scripts/render_pages.py]
  - pypdfium2 extracts text from each page (up to 120)
  - pages under 100 characters are rendered to JPEG, capped at 16
       |
       v
[Sparse pages go to OpenAI vision OCR when OPENAI_API_KEY is set]
       |
       v
[Return per-page text, warnings, and page count]
       |
       v
[Browser saves the PDF and page text with Dexie]
```

## PDF Processing Pipeline

1. User uploads PDF via browser.
2. File sent to `/api/pdf/upload` API route.
3. The PDF is written to a temporary file (random name, deleted after extraction). Python (`scripts/render_pages.py`) extracts text per page and renders only sparse pages.
4. Pages with at least 100 characters of selectable text skip OCR.
5. Up to 16 sparse pages are sent to OpenAI vision in small batches. A page keeps its extracted text if OCR returns nothing better.
6. Vision OCR retries when the provider reports a rate limit.
7. `/api/pdf/rescan` runs the same pipeline again. Uploads over 20 MB are rejected.

## Test Generation Pipeline

1. User selects PDFs, difficulty, language, model, and question count.
2. Client calls `generateInBatches()`, which asks for up to 12 questions at a time.
3. Each batch calls `/api/generate`.
4. The server builds a prompt from a page window for that batch (later batches cover later pages), plus difficulty, language, old-exam style notes, and questions already written.
5. The chosen model returns JSON. Questions are repaired (choice labels, true/false wording) and checked with Zod. One retry runs if the payload cannot be used.
6. The client drops near-duplicate questions (word overlap above 0.7) and stores the test in the browser.
7. Practice mode shows the explanation after an answer. Exam simulation hides it until submit. A finished attempt can be drilled again using only the missed questions.

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

Runs the same extraction pipeline again. Useful when the first pass missed text on sparse pages.

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

- Put API keys in `.env.local` on the machine that runs the app. Do not commit that file.
- Lecture text and, for sparse pages, page images are sent to the model provider when you generate questions or run OCR.
- The uploaded PDF is written to a temp file for extraction and deleted when that step finishes.
- There is no login. Run it for yourself. Do not put it on a public URL with your API key, or other people can spend that key.
