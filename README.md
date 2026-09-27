# STARK

**Upload your lectures. Generate practice exams. Ace your finals.**

An open-source exam practice app. Fork it, run it on your machine, and generate practice questions from your own lecture PDFs. You bring an API key from a model provider. There is nothing to buy from this project.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org)

https://github.com/user-attachments/assets/32b7e525-51e3-4b25-bf97-f24602a3a489

---

## Features

- **Practice tests from your PDFs** — multiple choice, true/false, short answer, and fill-in-the-blank
- **Coverage across the lecture** — later batches use later pages, not only the opening section
- **Two model providers** — OpenAI, or Anthropic if you add that key
- **PDF reading** — pypdfium2 for selectable text, OpenAI vision for pages with little text
- **Old exams as style context** — upload a past paper so new questions follow that format
- **Practice and exam simulation** — practice shows the explanation after each answer; exam mode hides it until you submit
- **Missed-question drill** — retry only the questions you got wrong
- **Short answers** — equivalent wording can count, not only a character-for-character match
- **Score history** — track attempts over time
- **Difficulty levels** — Easy, Medium, and Hard, aligned with Bloom's taxonomy
- **English and German** questions
- **Optional instructions** — ask for a format or a topic split inside the exam rules

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Python 3.9+ (for PDF text extraction)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/shodiBoy1/stark.git
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
| Browser storage | Dexie.js |
| PDF extraction | pypdfium2, OpenAI vision for sparse pages |
| Question generation | OpenAI GPT-4o Mini, or Anthropic Claude Sonnet |
| Charts | Recharts |
| Validation | Zod |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your key. Used for question generation and for reading sparse PDF pages |
| `ANTHROPIC_API_KEY` | No | Your key. Enables Claude Sonnet as a second model |
| `STARK_VENV_PATH` | No | Custom path to the Python virtual environment (default: `~/.stark-venv`) |

## Run it yourself

Clone the repo and follow [docs/SELF-HOST.md](docs/SELF-HOST.md). The app is meant to run on your computer for your own courses. Question generation sends the lecture text to the provider for the API key in `.env.local`.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

STARK is licensed under the [MIT License](LICENSE).
