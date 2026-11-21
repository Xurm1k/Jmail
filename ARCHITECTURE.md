# Jmail architecture and product decisions

## Current user journey

The public GitHub Pages site introduces Jmail and links to a shared Google Apps Script web app. The Apps Script runs as the Google account currently authorizing it. Each user then configures their own Gemini key, profile, match threshold, commute limit, spreadsheet, Drive folder, and daily trigger.

The onboarding UI is a wizard with four sections. The last section now has an **Apply** action. Applying saves the current criteria and contact fields, validates that Google resources, Gemini, consent, and a confirmed profile are ready, then switches the same app to its final automation page. It does not start email processing. A changed CV must be extracted, reviewed, and confirmed before applying; users can instead keep the already saved profile while changing criteria.

The final page is the ongoing control surface: run a check now, enable or stop daily checks, open the user's spreadsheet and folder, edit the profile or criteria, and delete Jmail data and disconnect. The action colors communicate intent: green for running/enabling, amber for stopping, blue for editing, red for deletion.

## Data boundary

- Google Apps Script User Properties keep each Google account's configuration, API key, profile, and resource IDs separate.
- The user's spreadsheet, folder, and generated files are created in that user's Google Drive.
- Jmail sends the CV text during profile setup and job email content during analysis to Google Gemini, using the user's own key and following the in-app consent.
- The Gmail worker checks recent Inbox messages, records suitable jobs, archives suitable messages, and moves other or below-threshold messages to Trash. A processing error should leave the message available for another run.
- Jmail can create application material and drafts. It does not automatically submit applications to employers.
- The delete flow stops triggers, clears saved properties, attempts to remove Jmail filters and labels, restores messages with Jmail labels to Inbox, and moves the Jmail folder and spreadsheet to Drive Trash. It cannot recall requests already sent to Gemini or delete external provider records.

## Why Google Apps Script is the current executor

It lets each user authorize the Google automation in their own account and keeps execution close to their Gmail and Drive. It avoids operating a Jmail server that stores every user's Gmail data. The trade-off is a visible Google authorization flow, OAuth policy requirements for public distribution, Apps Script quotas, and a less seamless URL transition than a fully hosted app.

A hosted backend could offer a more unified interface, but would require a carefully designed token vault, account isolation, retention/deletion controls, monitoring, incident response, and review of Google's restricted-scope policy. A desktop app can keep a database and local model on a user's machine, but setup still includes Google authorization and may require a model download and capable hardware.

## Product trade-offs and safeguards

1. **Automatic sorting versus false positives.** Current Jmail automatically sends messages classified as irrelevant or below the threshold to Trash. That is convenient but consequential. Recommend a separate job-search Gmail and check Trash during a pilot. A later public release should prefer recoverable quarantine or provide a reliable undo path.
2. **Gemini key.** A user-supplied key avoids putting the maintainer's key in a public client or paying for an unbounded shared service. It adds setup friction and the user's Gemini terms determine how submitted data is handled.
3. **Profile quality.** CV facts are extracted into a draft and checked against source text. The user reviews the profile before it is saved; exact extraction can still fail on scanned or badly formatted documents.
4. **Google authorization.** The privacy page explains data use but does not complete Google's OAuth verification. Scope classification, branding, domain ownership, and possible security review must be checked in the production Cloud project.

## Public alternatives reviewed

The review is a product comparison, not a code copy. Public projects show three useful patterns:

- **ApplyTrail** keeps the tracker in a local SQLite database and offers optional AI. Its documented setup still asks users to configure a Google OAuth client and local environment variables. This is a better local privacy model, but a heavier first-run process for a nontechnical job seeker.
- **Haolinc/job-tracker** uses a Windows desktop launcher with local Ollama classification, a local database, board/table views, and CSV import/export. It reduces cloud AI data transfer but requires a desktop install, model download, and suitable hardware.
- **ApplyBoard / JustAJobApp** show the convenience of automatic email classification and a central dashboard. Their hosted model also requires users to trust the operator with inbox access and to meet applicable OAuth and data-handling requirements.

Jmail's current direction is a compromise: browser-based guided setup, account-owned Google files and triggers, user-owned Gemini key, and one final control page. The main remaining friction is still Google consent and Gemini key setup; the product should not claim those steps disappeared.

## Release verification boundary

The owner has used the live app with a personal Google account and has reported successful processing attempts. That is useful pilot evidence, not independent verification of account isolation, data deletion, OAuth compliance, or safety against every false positive. The current project should be described as an active pilot, not as OAuth-verified or production-certified.

See [`CHANGELOG.md`](./CHANGELOG.md) for the beta-to-current history, [`docs/OPEN_SOURCE_ALTERNATIVES.md`](./docs/OPEN_SOURCE_ALTERNATIVES.md) for dated sources, and [`LIVE_TEST_RU.md`](./LIVE_TEST_RU.md) for the current pilot guide.
