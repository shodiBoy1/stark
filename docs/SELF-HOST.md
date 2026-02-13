# Self-Hosting Guide

This guide walks you through setting up STARK on your own machine or server. STARK is an AI-powered exam prep tool built with Next.js 16. All user data stays in the browser (IndexedDB), so there is no database to configure.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 18+** (recommend 20 LTS) -- [download here](https://nodejs.org/)
- **pnpm** -- install with `npm install -g pnpm`
- **Python 3.9+** -- needed for PDF text extraction
- **An OpenAI API key** (required) -- used for test generation (GPT-4o Mini) and Vision OCR
- **An Anthropic API key** (optional) -- enables Claude Sonnet as an alternative AI model

## Step-by-step Setup

### 1. Clone and install

```bash
git clone https://github.com/usestark/stark.git
cd stark
pnpm install
```

### 2. Python venv setup

The PDF processing pipeline needs Python with pypdfium2 and Pillow. The virtual environment must be created outside the project directory to avoid issues with Turbopack.

**macOS / Linux:**

```bash
python3 -m venv ~/.stark-venv
source ~/.stark-venv/bin/activate
pip install pypdfium2 Pillow
deactivate
```

**Windows:**

```powershell
python -m venv $HOME\.stark-venv
$HOME\.stark-venv\Scripts\Activate.ps1
pip install pypdfium2 Pillow
deactivate
```

Alternatively, on macOS or Linux you can run the setup script:

```bash
bash scripts/setup.sh
```

If you want the venv in a custom location, set `STARK_VENV_PATH` in your `.env.local` (see the next step).

### 3. Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` in a text editor and fill in your values:

```
# Required -- OpenAI API key for test generation (GPT-4o Mini) and Vision OCR
OPENAI_API_KEY=sk-...

# Optional -- Anthropic API key to enable Claude Sonnet as alternative model
ANTHROPIC_API_KEY=sk-ant-...

# Optional -- Custom path to Python venv (default: ~/.stark-venv)
# STARK_VENV_PATH=/custom/path/to/venv
```

### 4. Run

**Development:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production:**

```bash
pnpm build
pnpm start
```

## Deploy Options

### Vercel

STARK works on Vercel with some caveats:

- PDF processing requires a Python runtime. Vercel's serverless functions support Python, but the pypdfium2 binary may need a compatible build for the serverless environment.
- Set your environment variables (`OPENAI_API_KEY`, etc.) in the Vercel dashboard under Settings > Environment Variables.
- Vercel has a 10-second function timeout on the Hobby (free) plan and 60 seconds on Pro. OCR processing may timeout on the free tier for large PDFs.

### Railway

Railway is a good fit for self-hosting STARK:

1. Connect your GitHub repo in the Railway dashboard.
2. Railway auto-detects Next.js and sets up the build.
3. Add a `nixpacks.toml` or `Procfile` if needed to install Python dependencies.
4. Set your environment variables in the Railway dashboard.
5. Python venv setup may need a custom build command -- refer to Railway's docs on multi-language projects.

### Docker (coming soon)

A Dockerfile is planned for a future release. In the meantime, you can create your own:

```dockerfile
FROM node:20-slim

RUN apt-get update && apt-get install -y python3 python3-pip python3-venv
RUN python3 -m venv /opt/stark-venv && /opt/stark-venv/bin/pip install pypdfium2 Pillow

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

ENV STARK_VENV_PATH=/opt/stark-venv
EXPOSE 3000
CMD ["pnpm", "start"]
```

Build and run:

```bash
docker build -t stark .
docker run -p 3000:3000 --env-file .env.local stark
```

### VPS / Bare Metal

1. SSH into your server.
2. Install Node.js 20, pnpm, and Python 3.9+.
3. Clone the repo and follow the setup steps above (install dependencies, create venv, configure `.env.local`).
4. Use PM2 or systemd to keep STARK running in the background:

```bash
pm2 start pnpm --name stark -- start
```

5. Put a reverse proxy like nginx or Caddy in front for HTTPS and domain routing.

## Data Storage

All user data -- PDFs, tests, settings -- is stored in the browser's IndexedDB. The server never persists any user data. This means:

- Each browser and device has its own separate data.
- Clearing your browser data will delete everything.
- There is no database server to set up or maintain.
- You cannot sync data between devices (each browser is independent).

## Troubleshooting

**PDF upload fails:**
Check that the Python venv exists at `~/.stark-venv` (or at the path you set in `STARK_VENV_PATH`) and that pypdfium2 is installed. You can verify by running:

```bash
~/.stark-venv/bin/python -c "import pypdfium2; print('OK')"
```

On Windows:

```powershell
$HOME\.stark-venv\Scripts\python -c "import pypdfium2; print('OK')"
```

**OCR timeout:**
OpenAI Vision can be slow when processing many pages. The upload route has a 120-second timeout. If you consistently hit this limit, try uploading smaller PDFs or splitting large ones into sections.

**"API key not configured" error:**
Make sure `.env.local` has the correct keys and that you have restarted the dev server after editing the file. Environment variable changes are not picked up without a restart.

**Windows path issues:**
If STARK cannot find your Python venv on Windows, set `STARK_VENV_PATH` explicitly in `.env.local` with the full absolute path to your venv folder. For example:

```
STARK_VENV_PATH=C:\Users\YourName\.stark-venv
```

**Port 3000 already in use:**
Another process is using port 3000. Either stop that process or run STARK on a different port:

```bash
pnpm dev -- -p 3001
```
