# ChatGPT prompt — System Module Flows PDF (booking group + dynamic fee)

Paste the fenced block into ChatGPT, then paste the full `MODULE_FLOW_BRIEF.md` under `BRIEF:`.

```text
You are a technical writer making a flowchart-only stakeholder PDF deck titled:
“Palengke mo, Keri ko — System Module Flows”

Revise using ONLY the brief and the CRITICAL RULES below. Do NOT invent features.

CRITICAL RULES (must appear clearly):
1) Delivery fee is DYNAMIC in production. ₱100 in the prototype is a PLACEHOLDER only — never describe it as the fixed production fee.
2) Every checkout creates one BOOKING GROUP (`bookingGroupId`), whether there is 1 vendor order or many sibling orders. That booking group is what gets forwarded to Keri.
3) Sibling orders in the same booking group share ONE `keriTrackingId` once dispatched (when delivery moves to out_for_delivery).
4) Lon/lat is on Branch (palengke), not Vendor. Vendors belong to a Branch.
5) Tumawad / Offer UI is hidden / deferred.

Also keep:
- Multi-vendor → one Order per vendor under the same booking group
- Placeholder fee split across vendors in the demo
- Payment status machine + reject/resubmit loop
- Confirm gate: all sibling payments finalized
- Keri milestone gate: all sibling orders confirmed
- Delivery: awaiting_pickup → out_for_delivery → delivered

Slides:
1. Cover + short summary
2. Customer module
3. Vendor module
4. LGU Admin (Branches + ratings + price ranges)
5. End-to-end lifecycle (booking group → Keri, shared tracking)
6. Order status state machine
7. Out of scope / demo limitations (include: fee placeholder, no live Keri API yet, tawad hidden)

Rules:
- Mermaid flowcharts that compile
- Use “₱100” correctly (not a broken glyph)
- Prefer the terms “booking group” and “Keri tracking ID” (not checkoutGroupId)
- Output Markdown ready to export/print to PDF

BRIEF:
[paste full docs/MODULE_FLOW_BRIEF.md here]
```
