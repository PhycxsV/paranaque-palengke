# ChatGPT packaging prompt (PDF)

Copy everything inside the fenced block below into ChatGPT.  
Then paste the full contents of [`MODULE_FLOW_BRIEF.md`](./MODULE_FLOW_BRIEF.md) where it says `BRIEF:`.

```text
You are a technical writer. Do NOT invent features, screens, or rules.

Using ONLY the module flow brief I paste below, produce a polished PDF-ready document titled:
“Palengke mo, Keri ko — System Module Flows”

Structure:
1. Cover / one-paragraph product summary
2. Actors & portals (Customer, Vendor, LGU Admin)
3. Customer module — numbered steps + mermaid flowchart
4. Vendor module — numbered steps + mermaid flowchart
5. LGU Admin module — numbered steps + mermaid flowchart
6. End-to-end order lifecycle (shared state machine)
7. Cross-module handoffs (who waits on whom)
8. Out of scope / demo limitations (explicit list from the brief)

Rules:
- Keep every status, gate, and fee exactly as written in the brief
- If something is missing, write “Not specified in brief” — do not guess
- Use clear headings, short bullets, and mermaid diagrams that compile
- Tone: professional, implementation-accurate, suitable for stakeholders
- Output in Markdown I can export to PDF (or canvas/print to PDF)

BRIEF:
[paste the full contents of docs/MODULE_FLOW_BRIEF.md here]
```

## How to export PDF

1. Open ChatGPT → paste the prompt + brief.
2. Ask it to keep mermaid diagrams intact.
3. Copy the Markdown into Notion / Google Docs / VS Code preview → Print → Save as PDF  
   (or use ChatGPT’s canvas / download if available in your plan).
