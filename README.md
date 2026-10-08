# 🤖 Personal AI Assistant — Waleed Badshah

A production-grade, installable AI assistant that answers questions about my professional background, projects, skills, and contact information. Built with Next.js, Groq, MongoDB Atlas, and Google Gemini — deployed on Vercel.

**Live:** [https://personal-ai-assistant-theta-self.vercel.app](https://personal-ai-assistant-theta-self.vercel.app)

---

## 📌 Overview

This is not a wrapper around ChatGPT. It's a complete AI product with:

- Retrieval-Augmented Generation (RAG) from a vector database
- Tool-calling for reminders and contact capture
- A progressive web app (PWA) installable on iOS and Android
- Real-time knowledge updates via GitHub webhooks
- Multilingual voice input and output

The assistant answers only from a curated knowledge base — it never invents details, and it enforces strict answer-length rules so responses stay natural, not bloated.

---

## ✨ Features

### Conversational

- **Streaming responses** — tokens render as they arrive, not all at once
- **Markdown rendering** — links, lists, code blocks, tables render correctly
- **Copy / Regenerate / Stop** — full control over every reply
- **Multi-language** — auto-detects English, Urdu, Arabic, Roman Urdu, and mixes naturally
- **Voice input** — Web Speech API with auto-language detection
- **Voice output** — Text-to-speech with per-language voice matching

### Rich content

- **Project cards** — swipeable cards with screenshots, tech stack, status, and live links
- **Contact form** — inline form that emails submissions to my inbox via Resend
- **Reminder system** — natural-language reminders stored in MongoDB, viewable in a side menu
- **Recruiter / Client / Technical modes** — the assistant adjusts its tone and focus per audience

### Platform

- **PWA installable** — works offline, launches fullscreen from the home screen
- **iOS install guide** — auto-detects Safari and shows Add to Home Screen steps
- **Android install banner** — appears after the second visit, dismissible
- **Safe-area aware** — respects notch, Dynamic Island, and home indicator
- **Dark theme** — gold accents, refined typography, serif headings
- **Haptic feedback** — subtle vibration on Android when sending / receiving
- **Offline banner** — shows when the device loses connection

### Intelligence

- **RAG via MongoDB Atlas** — persona, CV, project writeups, and GitHub commits are embedded and retrieved by vector similarity
- **GitHub integration** — every push to any of my repos triggers a webhook that ingests the commit into the knowledge base in real time
- **Multi-step tool calling** — the model chooses when to show a form, create a reminder, or answer in plain text

---

## 🛠️ Tech Stack

| Layer            | Technology                                               |
| ---------------- | -------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack)                       |
| Language         | TypeScript (strict)                                      |
| Styling          | Tailwind CSS v4                                          |
| LLM (chat)       | Groq — `openai/gpt-oss-120a`                             |
| LLM (embeddings) | Google Gemini — `gemini-embedding-041`                   |
| Vector database  | MongoDB Atlas (Vector Search)                            |
| Document store   | MongoDB Atlas                                            |
| Email            | Resend                                                   |
| Icons / fonts    | `next/font` (Inter, Playfair Display, Noto Naskh Arabic) |
| Markdown         | `react-markdown` + `remark-gfm`                          |
| Deployment       | Vercel                                                   |

---

**Policy section:**

- Clear "All rights reserved" statement
- ✅ What visitors **can** do (read, fork locally, submit PRs)
- ❌ What visitors **cannot** do (copy, redeploy, redistribute, commercial use)
- Explicit legal notice about copyright infringement
- Contact information for licensing requests
- Copyright symbol with the year

**Footer:**

- Direct links to email, LinkedIn, portfolio
- A star-the-repo call to action
