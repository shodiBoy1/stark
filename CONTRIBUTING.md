# Contributing to STARK

Thanks for wanting to help out. STARK is built by students, for students, and every contribution matters -- whether it is fixing a typo, improving a prompt, or adding a whole new feature.

This guide will walk you through everything you need to get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Where Help Is Needed](#where-help-is-needed)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Commit Messages](#commit-messages)
- [Opening a Pull Request](#opening-a-pull-request)
- [Getting Help](#getting-help)

---

## Code of Conduct

Be respectful. We are all here to learn and build something useful. Harassment, gatekeeping, and unhelpful negativity will not be tolerated.

---

## Where Help Is Needed

Here are the areas where contributions would have the most impact:

- **Prompt Engineering** -- Improve the AI-generated questions. Better prompts mean better study material. If you have ideas for making questions more accurate, more challenging, or better targeted to specific exam formats, this is a great place to start.
- **File Format Parsers** -- Right now STARK handles PDFs. We need parsers for DOCX and PPTX so students can upload their lecture slides and notes directly.
- **UI/UX Improvements** -- Better layouts, accessibility fixes, mobile responsiveness, dark mode polish -- anything that makes the app easier and more pleasant to use.
- **Internationalization (i18n)** -- STARK should work for students everywhere. Help us add support for more languages.
- **Documentation** -- Clearer docs, better examples, self-hosting guides, tutorials. If something confused you when getting started, it probably confuses others too.

---

## Development Setup

STARK uses Next.js 16 (App Router, React 19), TypeScript, Dexie.js for local storage, and Python (pypdfium2) for PDF text extraction.

### Prerequisites

- Node.js 20 or later
- pnpm
- Python 3.10 or later
- Git

### Step-by-step setup

**1. Fork and clone the repository**

Go to the STARK repo on GitHub and click "Fork". Then clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/stark.git
cd stark
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Set up the Python environment**

**macOS / Linux:**

```bash
bash scripts/setup.sh
```

This creates a Python virtual environment at `~/.stark-venv` with pypdfium2 and Pillow installed. The venv is kept outside the project directory on purpose -- bundlers like Turbopack do not handle symlinks inside the project well.

**Windows:**

If the setup script does not work on Windows, you can create the venv manually:

```powershell
python -m venv %USERPROFILE%\.stark-venv
%USERPROFILE%\.stark-venv\Scripts\activate
pip install pypdfium2 Pillow
deactivate
```

Or in PowerShell:

```powershell
python -m venv $env:USERPROFILE\.stark-venv
& "$env:USERPROFILE\.stark-venv\Scripts\Activate.ps1"
pip install pypdfium2 Pillow
deactivate
```

**4. Configure environment variables**

```bash
cp .env.example .env.local
```

Open `.env.local` and add your API keys. The file has comments explaining each variable.

**5. Start the dev server**

```bash
pnpm dev
```

The app should now be running at `http://localhost:3000`.

---

## Project Structure

```
src/
  app/          — Next.js app router pages + API routes
  components/   — React components
  hooks/        — Custom React hooks (useProjects, usePDFs, useTests, etc.)
  lib/          — Shared utilities (db.ts, prompts.ts, schemas.ts, etc.)
scripts/        — Python scripts for PDF processing
docs/           — Documentation
```

- **`src/lib/db.ts`** -- The Dexie.js database schema. All data is stored client-side in IndexedDB.
- **`src/lib/prompts.ts`** -- The prompts sent to the AI for generating test questions. This is where prompt engineering work happens.
- **`src/lib/schemas.ts`** -- Zod schemas for validating AI responses and other data structures.
- **`src/hooks/`** -- Custom hooks that provide data access patterns (`useProjects`, `usePDFs`, `useTests`, `useSettings`, `useStats`).
- **`scripts/`** -- Python scripts for PDF text extraction using pypdfium2.

---

## Making Changes

**1. Create a feature branch**

Always work on a branch, never directly on `main`:

```bash
git checkout -b feat/your-feature-name
```

Use a descriptive branch name. Some examples:

- `feat/docx-parser`
- `fix/score-calculation`
- `docs/setup-guide-windows`

**2. Make your changes**

Write your code, test it locally, and make sure everything works.

**3. Lint before committing**

```bash
pnpm lint
```

Fix any issues before committing. This keeps the codebase consistent.

**4. Commit your changes**

```bash
git add .
git commit -m "feat: add DOCX file parser"
```

See the [Commit Messages](#commit-messages) section below for the format we use.

**5. Push and open a PR**

```bash
git push origin feat/your-feature-name
```

Then open a pull request on GitHub against the `main` branch.

---

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). This keeps the git history readable and makes it easy to generate changelogs.

The format is:

```
type: short description
```

### Types

| Type       | When to use it                                      |
|------------|-----------------------------------------------------|
| `feat`     | Adding a new feature                                |
| `fix`      | Fixing a bug                                        |
| `docs`     | Documentation changes only                          |
| `refactor` | Code changes that do not fix a bug or add a feature |
| `style`    | Formatting, missing semicolons, etc. (not CSS)      |
| `test`     | Adding or updating tests                            |
| `chore`    | Build process, dependency updates, tooling          |

### Examples

```
feat: add DOCX parser
fix: correct score calculation
docs: update self-hosting guide
refactor: simplify PDF pipeline
style: fix inconsistent indentation in sidebar
test: add unit tests for prompt builder
chore: upgrade Next.js to 16.1
```

Keep it short (under 72 characters), lowercase, no period at the end.

---

## Opening a Pull Request

When your changes are ready:

1. **Keep PRs focused.** One feature or one fix per PR. If you did two unrelated things, split them into two PRs.

2. **Write a clear description.** Explain what you changed and why. If it is a bug fix, describe the bug. If it is a feature, explain what it does and how it works.

3. **Add screenshots for UI changes.** If your PR changes anything visual, include before/after screenshots. This makes review much faster.

4. **Test your changes locally.** Make sure the dev server runs, the feature works, and nothing else is broken. Run `pnpm lint` one more time.

5. **Be patient.** Reviews might take a few days. If changes are requested, do not take it personally -- it is part of the process.

---

## Getting Help

If you get stuck at any point:

- Open a GitHub issue with the question.
- Check existing issues and discussions -- someone might have hit the same problem.
- Read through the docs in the `docs/` directory.

There are no stupid questions. If something is confusing, it probably means the docs need improving -- and that itself is a contribution worth making.
