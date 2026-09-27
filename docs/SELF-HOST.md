# Run STARK yourself

STARK is an exam practice app. Fork the repository, run it on your computer, and use your own API key. There is no account and nothing to purchase from this project.

Generating a test sends the lecture excerpt to the model provider for the key in `.env.local`. Sparse PDF pages can also be sent as images when selectable text is missing. The model provider bills that usage on your key.

## Prerequisites

- **Node.js 20+** (22 LTS is a good choice) — [nodejs.org](https://nodejs.org/)
- **pnpm** — `npm install -g pnpm`
- **Python 3.9+** — used to read PDF text
- **An OpenAI API key** — question generation and reading sparse pages
- **An Anthropic API key** (optional) — turns on Claude Sonnet as a second model

## Setup

### 1. Clone and install

```bash
git clone https://github.com/shodiBoy1/stark.git
cd stark
pnpm install
```

If you forked the repo, clone your fork instead.

### 2. Python environment

PDF reading needs `pypdfium2` and Pillow. The virtual environment lives outside the project so the Next.js bundler does not follow it.

```bash
pnpm setup
```

That creates `~/.stark-venv` on macOS and Linux. On Windows, create it yourself:

```powershell
python -m venv $HOME\.stark-venv
$HOME\.stark-venv\Scripts\Activate.ps1
pip install pypdfium2 Pillow
deactivate
```

To put the environment somewhere else, set `STARK_VENV_PATH` in `.env.local`.

### 3. API key

```bash
cp .env.example .env.local
```

```
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
# STARK_VENV_PATH=/custom/path/to/venv
```

`ANTHROPIC_API_KEY` is optional. Restart the server after you change this file.

### 4. Start

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production build on the same machine:

```bash
pnpm build
pnpm start
```

## What gets stored

PDFs, generated tests, and settings are saved in the browser you used (IndexedDB via Dexie). Another browser, or a cleared site storage, starts empty. There is no database server.

The app process does not keep uploaded PDFs after text extraction. It does send lecture text to the model API when you generate questions.

## Large files

There is no upload size limit and no page cutoff. The PDF stays in the browser. Pages with little selectable text are read with your API key, a few at a time, so a long scan takes longer and uses more of that key.

A test still asks the model about one section of the lecture at a time. Later sections are covered in later batches, up to 60 questions per test.

## Troubleshooting

**PDF upload fails**

Check that the Python environment exists and can import the PDF library:

```bash
~/.stark-venv/bin/python -c "import pypdfium2; print('OK')"
```

On Windows:

```powershell
$HOME\.stark-venv\Scripts\python -c "import pypdfium2; print('OK')"
```

If the app cannot find that interpreter, set `STARK_VENV_PATH` to the folder that contains `bin` (or `Scripts` on Windows) and restart.

**"API key not configured"**

`.env.local` needs `OPENAI_API_KEY`. Restart `pnpm dev` after editing it.

**OCR is slow or incomplete**

Scanned pages are read a few at a time. If a lecture is mostly images, split it, or export a text-based PDF from the original slides.

**Port 3000 is taken**

```bash
pnpm dev -- -p 3001
```
