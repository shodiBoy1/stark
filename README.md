# STARK

**Upload your lectures. Generate practice exams. Ace your finals.**

A self-hosted, AI-powered exam preparation tool. Upload your lecture PDFs, and STARK generates realistic practice exams using OpenAI or Anthropic. All data stays on your machine — nothing is stored on external servers.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org)

---

## Features

- **AI-generated practice tests** — multiple choice, true/false, short answer, and fill-in-the-blank
- **Dual AI provider** — choose between OpenAI (GPT-4o Mini) and Anthropic (Claude Sonnet)
- **Smart PDF pipeline** — pypdfium2 for fast text extraction, with OpenAI Vision OCR fallback for scanned documents
- **Upload lecture PDFs and old exams** — STARK matches the style of your professor's real exams
- **Project-based organization** — group materials by course with exam context for better generation
- **Batch generation with deduplication** — generate up to 80 questions without repeats
- **Practice mode and Exam simulation** — timed exam mode with countdown, or untimed practice
- **Performance analytics** — track your scores over time with visual breakdowns
- **Bloom's taxonomy difficulty levels** — Easy, Medium, and Hard question tiers
- **Multi-language support** — English and German
- **Custom instructions** — fine-tune how the AI generates your questions
- **100% local data** — your data lives in your browser's IndexedDB and never leaves your machine

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Python 3.9+ (for PDF text extraction)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/usestark/stark.git
cd stark
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up the Python environment for PDF processing:

```bash
pnpm setup
# or manually: bash scripts/setup.sh
```

This creates a Python virtual environment and installs pypdfium2 and Pillow.

4. Configure your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys (see [Environment Variables](#environment-variables) below).

5. Start the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Local Storage | Dexie.js (IndexedDB) |
| PDF Extraction | pypdfium2 (fast), OpenAI Vision gpt-4o-mini (OCR fallback) |
| AI Generation | OpenAI GPT-4o Mini, Anthropic Claude Sonnet |
| Charts | Recharts |
| Validation | Zod |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Powers test generation (GPT-4o Mini) and Vision OCR for scanned PDFs |
| `ANTHROPIC_API_KEY` | No | Enables Claude Sonnet as an alternative AI model for generation |
| `STARK_VENV_PATH` | No | Custom path to the Python virtual environment (default: `~/.stark-venv`) |

## Self-Hosting

STARK is designed to be self-hosted. For detailed deployment instructions, including Docker setup and reverse proxy configuration, see [docs/SELF-HOST.md](docs/SELF-HOST.md).

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

STARK is licensed under the [GNU Affero General Public License v3.0](LICENSE).
