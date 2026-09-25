# Atlas Desk project context

- This is a dependency-free browser demo for a multi-workspace document assistant.
- Preserve strict workspace isolation: retrieval must receive the active workspace before ranking or citing documents.
- Keep tool execution allow-listed and validate arguments before side effects.
- Keep secrets server-side when adding a production adapter; never place API keys or webhook URLs in browser code.
- Prefer small, focused edits and validate HTML, CSS, and JavaScript after changes.
