# Public job-search automation projects reviewed

**Reviewed:** 21 November 2026. This is a snapshot of public repository documentation, not an independent security or code audit. No source code was copied into Jmail.

## Comparison

| Project | Published approach | What Jmail can learn | Cost to a nontechnical user |
|---|---|---|---|
| [ApplyTrail](https://github.com/rutuu/ApplyTrail) | Gmail-connected local web app, local SQLite, mostly rule-based classification with optional AI. Its README asks users to create a Google Cloud OAuth client, configure local environment variables, install Node, and run the app. Repository lists an MIT license. | Keep the user's job data local and make classification evidence editable. | User must install software and complete a developer-style Google OAuth setup. |
| [Haolinc/job-tracker](https://github.com/Haolinc/job-tracker) | Windows desktop launcher, local SQLite, Gmail sync, parser plus local Ollama model, table/board, CSV import/export. Its README says the first use requires a Google Cloud project and describes downloading a local model. | Local inference avoids sending email to an AI API; preserve an audit trail back to source emails and editable classifications. | Desktop install, Google Cloud setup, model download, storage and memory requirements. |
| [ApplyBoard](https://github.com/LorisDrid/ApplyBoard) | Next.js application that reads job-related Gmail, filters before LLM calls, writes to a Kanban dashboard, and uses PostgreSQL and a hosted LLM. | Filter cheaply before an AI call; prevent duplicates and group related emails; keep the source email reachable. | A hosted app can feel seamless, but its operator must earn trust for Gmail access and operate the cloud data boundary. |
| [JustAJobApp](https://github.com/JustAJobApp/jobseeker-analytics) | Public Gmail-integrated job tracker with a hosted dashboard. Its README states that the maintainer completed an independent security audit and Google OAuth approval; those are the project's claims, not independently verified in this review. | Trust signals, narrow message selection, and transparent audit information are product features, not afterthoughts. | Hosted onboarding is simple for a job seeker; the provider takes on verification, security, and ongoing operations. |

## What this suggests for Jmail

There is no cost-free shortcut that removes both Google authorization and trustworthy handling of mailbox data. The projects cluster around three choices:

1. **Local-first desktop:** strongest control over stored data and access to local models; more installation, hardware, and maintenance work for the user.
2. **Hosted service:** easiest day-to-day UX; requires OAuth review, production security practices, a backend, and clear data-retention policies.
3. **User-account automation:** Google Apps Script can run as the user's Google account and put files in that user's Drive without Jmail keeping a central profile database; Google consent and the Gemini key still add friction.

Jmail currently takes the third route because it best fits the source project and the user's goal of creating a personal Gmail-to-Sheets workflow without maintaining a server. The improved Apply transition reduces navigation and keeps recurring actions on one page. It does not eliminate the key, Google consent, the risk of automatic Trash actions, or OAuth review requirements.

## Product ideas worth carrying forward

- Link each classified result to its source Gmail message and show why the model made the decision.
- Prefer a reversible review/quarantine state when the cost of a false negative is high.
- Provide edit, export, and deletion paths so the user can correct automation and leave the product.
- Use a local-first mode as a separate future product direction if setup simplicity becomes less important than keeping email and AI inference on the user's device.
- Do not claim cost savings, accuracy, time saved, user validation, or security approval without measured and documented evidence.

## References

- ApplyTrail README and setup: <https://github.com/rutuu/ApplyTrail>
- Haolinc/job-tracker README and privacy notes: <https://github.com/Haolinc/job-tracker>
- ApplyBoard README and architecture: <https://github.com/LorisDrid/ApplyBoard>
- JustAJobApp README and published trust claims: <https://github.com/JustAJobApp/jobseeker-analytics>
- Google's current OAuth verification overview: <https://developers.google.com/identity/protocols/oauth2/production-readiness/overview>
