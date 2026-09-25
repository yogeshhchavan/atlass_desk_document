# Atlas Desk

Atlas Desk is a multi-workspace document assistant. It keeps one shared SQLite `chunks` table for all workspaces while applying the active `workspace_id` filter inside retrieval. The local build includes authentication, persistent chat, document ingestion, citations, and validated tool actions.

## Run locally

This workspace intentionally has no Node dependency. Start the full-stack server from the project root:

```powershell
python server.py
```

Open <http://localhost:4173>.

The seeded demo contains three workspaces, including two documents in Product Launch. Sign in with the seeded assessment account, then switch workspaces, ask the same distinctive question in each, upload `.txt`, `.md`, or `.csv` files, and use prompts such as:

- Email: `demo@atlas.local`
- Password: `assessment123`

- `What is the top request from customers?`
- `What is the launch date?`
- `Save task: confirm the kickoff agenda`
- `Send a summary to the team`
- `What is the secret fact from another workspace?`

State is stored in `atlas.db`. Delete that file to reset the local seed data.

## Architecture and safety notes

- Every workspace's chunks share one `chunks` table. Retrieval applies `WHERE chunks.workspace_id = ?` in SQL before vector/lexical scoring and citations are returned.
- A document is split into chunks, hashed, embedded with a deterministic local vector, and stored with its workspace. Re-uploading identical content is deduplicated by `(workspace_id, content_hash)`.
- Answers without a matching workspace passage explicitly say they do not know. Source citations show the document used.
- Tool intent is validated against an allow-list and argument schema before execution. `save_task` and `send_summary` are recorded in the active workspace activity log. External webhooks are deliberately not called in local mode. If `GEMINI_API_KEY` is present, grounded answer wording is generated server-side by Gemini; otherwise the deterministic grounded fallback is used.
- Retrieved document text is inserted as data in the answer path; it is never treated as instructions. The production LLM prompt should preserve the same rule.

## Production path

The local UI and server are dependency-free for assessment and local review. To deploy with Gemini and a hosted database:

1. Use Supabase Auth for sign-in and Postgres/pgvector for the same shared `document_chunks` shape with `workspace_id` on every row.
2. Hash uploads and use a unique workspace/hash constraint for idempotent ingestion.
3. Keep Gemini and webhook credentials in server-only environment variables. Validate model tool calls with a server schema library such as Zod.
4. Deploy the Python server and browser assets to a host that supports a long-running Python process.

## Environment variables

See `.env.example`. The local deterministic build does not read secrets. The variables are the intended Gemini, Supabase, and webhook adapter contract.

## Deployment

The included `render.yaml` is a deployment definition for Render's free web service. Connect this repository in Render, apply the blueprint, and optionally set `GEMINI_API_KEY` as a server-only environment variable. The public URL and hosted database require deployment credentials, which are not available in this environment.

## AI context

`AI_NOTES.md` records the AI collaboration and key implementation decisions. `.github/copilot-instructions.md` contains the project-specific context used for implementation.
