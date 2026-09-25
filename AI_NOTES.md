# AI Notes

## Tools and models

I used GitHub Copilot in VS Code to translate the assessment brief into a small, runnable full-stack application. The local implementation uses Python's standard library, SQLite, and deterministic local embeddings so it is reproducible without paid services or credentials. The intended production adapter is documented for Gemini, Supabase, and a server-side webhook integration.

## Decisions made

1. I chose a Python standard-library server because the provided environment has no Node/npm runtime. This preserves an end-to-end demonstrable workflow rather than leaving an un-runnable framework scaffold.
2. I put every chunk in one shared SQLite table and made `workspace_id` part of the SQL retrieval predicate before ranking. The isolation boundary is therefore enforced by the data query, not by a UI filter.
3. I kept tool execution behind an explicit allow-list and argument validator. `save_task` creates a persisted task and activity record; external notification calls remain disabled until server secrets are configured.

## Hardest wrong turn

The first instinct was to use a normal Next.js scaffold, but the machine did not have `npx` available. Treating that as a reason to stop would have produced no testable product. I changed course to a dependency-free Python server. A later retrieval test exposed that hashed-vector similarity could return an unrelated passage; I noticed it by asking for the Product Launch date inside Client Operations. I fixed it by keeping the workspace SQL predicate and requiring meaningful whole-token lexical support in addition to vector similarity.

## Improvements with more time

The next step would be a server adapter with Supabase Auth, a single pgvector table, Gemini embeddings, streaming responses, content hashes for idempotent ingestion, and integration tests that attempt cross-workspace retrieval and prompt injection. A real deployment URL, throwaway account, and webhook test would also be added before submission.
