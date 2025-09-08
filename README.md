# GoodnightGPT — Frontend (Next.js)

Chat UI for GoodnightGPT with document upload and RAG context display. Connects to the FastAPI backend in `../goodnight-gpt-svc`.

## Quickstart

1) Install dependencies

```bash
npm install
```

2) Configure backend URL (optional)

- The app reads `NEXT_PUBLIC_API_BASE` from `.env.local`.
- If not set, it defaults to `http://localhost:8000` (see `src/utils/constants.ts`).

Example `.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

3) Run dev server

```bash
npm run dev
```

Open http://localhost:3000 to use the app. Start the backend first.

## Features

- Chat with RAG: messages sent to backend `/chat`. Returned context snippets are shown under AI replies.
- Document upload UI (`DocumentUpload`): sends files to backend `/upload-document`.
	- Supported: .txt, .pdf, .docx, .doc, .csv
	- Max size: 10MB
	- Shows upload status and chunk counts
- Keyboard shortcuts: Cmd/Ctrl + Shift + O to start a new chat
- Input UX: Enter to send, Shift+Enter for newline

Notes
- PDF/DOCX processing requires backend dependencies (`PyPDF2`, `python-docx`).
- If Anthropic isn’t configured on the backend, responses use a local dev fallback.

## Scripts

- `npm run dev` — start Next.js dev (Turbopack)
- `npm run build` — production build
- `npm start` — run production server

## Backend integration

Ensure the backend is running and reachable at `NEXT_PUBLIC_API_BASE`.
- Backend repo folder: `../goodnight-gpt-svc`
- Docs and endpoints: see that project’s README

## Troubleshooting

- Connection errors: verify backend health at `GET /` and `NEXT_PUBLIC_API_BASE` value.
- CORS: backend allows all origins for local development.
- Upload failures: confirm file type and size (≤10MB). For PDFs/Word, ensure backend extras are installed.

