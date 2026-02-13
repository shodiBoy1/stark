# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in STARK, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, use [GitHub's private vulnerability reporting](https://github.com/shodiBoy1/stark/security/advisories/new) to submit your report.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Fix timeline communicated once the issue is triaged

## Security Best Practices for Self-Hosting

- **Never commit `.env` files** — use `.env.local` for local development
- **Rotate API keys** regularly for OpenAI and Anthropic
- **Keep dependencies updated** — run `pnpm update` periodically
- All data is stored locally in your browser's IndexedDB — no data leaves your machine except API calls to OpenAI/Anthropic for question generation and OCR
