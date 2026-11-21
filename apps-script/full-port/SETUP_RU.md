# Apps Script source for Jmail

The account-specific full-port source for the shared Jmail web app is in this folder. For the user walkthrough, see [`LIVE_TEST_RU.md`](../../../LIVE_TEST_RU.md). For the maintained product flow and privacy boundaries, see [`README.md`](../../../README.md) and [`privacy.html`](../../../privacy.html).

## Deployment requirements

- Publish as a Google Apps Script Web App with **Execute as: User accessing the web app** and the intended public audience.
- The user must authorize the script from their own Google account. Do not deploy to execute as the maintainer.
- Each user's Gemini key, profile, settings, and resource IDs rely on Apps Script `UserProperties`.
- Back up the currently deployed Apps Script source and deployment before pushing a new release.

## Current wizard behavior

1. Create personal Drive and spreadsheet resources.
2. Save the user's Gemini key and consent.
3. Extract CV text in the browser, generate a factual profile draft, and require the user to confirm it.
4. **Apply** saves editable settings and opens the separate automation page after prerequisites are complete. It does not start email processing.

The worker evaluates recent Inbox messages, records suitable jobs, archives suitable email, and moves other or below-threshold messages to Trash. Failed analysis must not be treated as a negative job decision. The live deployment and Google OAuth verification status must be confirmed separately; passing local synthetic scripts is not proof of live or multi-account safety.
