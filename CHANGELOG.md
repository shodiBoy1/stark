# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-09-27

### Changed

- Questions are drawn from page windows across the PDF, not only the opening pages
- Practice mode shows an explanation after each answer; exam mode still waits until submit
- Finished attempts can be drilled using only missed questions
- Short answers accept equivalent wording, including German spelling
- PDF reading has no file-size or page cap. Sparse pages are read with the configured API key, a few at a time
- Setup docs point at this repository and describe a local run

## [0.1.0] - 2026-02-13

### Added

- PDF upload with automatic text extraction and OCR fallback (GPT-4o Vision)
- AI-powered test generation using GPT-4o Mini and Claude Sonnet
- Multiple question formats: multiple choice, true/false, short answer, fill-in-blank
- Project-based course organization with exam context
- Practice and exam simulation modes with countdown timer
- Batch question generation with deduplication
- Analytics dashboard with score trends and breakdowns
- Multi-language support (English, German)
- Browser storage for PDFs and tests, with no separate database
- Setup documentation and setup scripts
- Old exam upload for AI style matching
