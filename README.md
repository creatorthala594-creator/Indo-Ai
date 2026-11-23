# INDO AI — Website starter

INDO AI is a responsive AI assistant website with:
- AI chat using the OpenAI Responses API
- Web search tool for current information
- Image generation
- Image upload and image understanding
- Hindi/English-friendly assistant instructions
- Optional browser speech-to-text
- Server-side API key (never expose it in browser code)

## Requirements
- Node.js 20 or newer
- An OpenAI API key with API billing/usage enabled
- API access to the models configured in `.env`

## Run locally
1. Extract this ZIP.
2. Open a terminal in the `indo_ai` folder.
3. Install packages:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`.
5. Put your API key in `.env`:
   ```env
   OPENAI_API_KEY=your_real_key_here
   ```
6. Start the app:
   ```bash
   npm start
   ```
7. Open `http://localhost:3000`.

## Deploy online
Deploy the folder to a Node.js hosting service (for example Render, Railway, or another Node host). Set the environment variables in the host dashboard:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)
- `OPENAI_IMAGE_MODEL` (optional)

Build command: `npm install`
Start command: `npm start`

Do not upload `.env` or publish your API key. Add a spending limit/usage alert in your API account. Public deployment should add user authentication, stronger per-user quotas, abuse monitoring, and persistent chat storage before sharing widely.

## Notes
- This is a working starter, not a claim that an AI knows every fact. Models can be wrong and current information should be checked.
- API usage can cost money; image generation may cost more than text.
- Default model IDs can vary by account availability. If you get a model access error, set `OPENAI_MODEL` and `OPENAI_IMAGE_MODEL` to models enabled for your API account.
- Voice input uses the browser's speech recognition support and may not be available on every device/browser.
