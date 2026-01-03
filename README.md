# MedAI Frontend

MedAI Frontend is the clinical web interface for MedAI entity extraction.
It is a React/Next.js application that consumes the **Backend API** (FastAPI)
and presents extraction and normalization results for clinical review.

## What MedAI is (and is not)

MedAI Frontend:
- Provides clinician-facing workflows for single and batch extraction.
- Visualizes extracted entities, normalization codes, and backend metadata.
- Serves as the reference implementation of the **Frontend API**.

MedAI Frontend is not:
- A model training environment or NLP research sandbox.
- A backend replacement or data processing pipeline.
- A storage system for PHI beyond what the Backend API explicitly persists.

## Architecture overview

- **Next.js App Router** for routing, layout, and client rendering.
- **HTTP client layer** in `lib/http.ts` with normalized error handling.
- **Backend API services** in `lib/api.ts` for extraction endpoints.
- **Model settings provider** in `components/providers` to enforce locked defaults.
- **UI modules** for uploads, settings, entity legends, and results.

## UI -> Backend API flow

1. **UI** collects text or files plus episode metadata.
2. **Frontend API** posts multipart `FormData` to the Backend API.
3. **Backend API** returns acknowledgements and identifiers.
4. **Results view** retrieves `/notes/{id}` and renders entities.

## Key directories

- `app/`: App Router routes and layouts.
- `components/`: UI surfaces for extraction, results, and settings.
- `constants/`: entity catalog used for coloring and descriptions.
- `lib/`: Frontend API client, HTTP helpers, and shared types.
- `public/`: static assets.
- `index.ts`: TypeDoc entry point for the Frontend API.

## Environment variables

These variables are public (`NEXT_PUBLIC_`) and evaluated client-side:

- `NEXT_PUBLIC_BACKEND_URL`: Base URL for the Backend API.
  - Example: `http://localhost:8000`
- `NEXT_PUBLIC_APP_URL`: Public URL for the frontend (metadata and links).
  - Example: `http://localhost:3000`

## Scripts

- `npm run dev`: Start the local development server.
- `npm run build`: Build for production.
- `npm run start`: Run the production build.
- `npm run lint`: Lint the codebase.
- `npm run format`: Format with Prettier.
- `npm run format:check`: Check formatting.
- `npm run docs:api`: Generate TypeDoc markdown for the Frontend API.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (optional):

```bash
export NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Documentation generation (TypeDoc -> Docusaurus)

This repository generates **Frontend API** documentation with TypeDoc.
The output is Markdown in `docs-api/` and is intended to be copied into
`docs-medai/docs/api/front/` for Docusaurus.

```bash
npm run docs:api
```

## References

- Docs: https://herreran903.github.io/docs-medai/
- App: https://medai-frontend-seven.vercel.app/
- Backend repository: https://github.com/Herreran903/medai-backend
