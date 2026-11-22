# Jmail

Jmail is a guided Gmail job-alert assistant. A job seeker connects a separate Google account, adds a Gemini API key, uploads a CV, and sets job-fit and commute criteria. Jmail creates a personal Google Sheet and Drive folder, evaluates recent job-alert email, and prepares application material. The user reviews the results and decides which applications to send; Jmail does not submit applications automatically.

## User problem and portfolio value

A high volume of job alerts can mean repeated reading, matching, tracking, and document preparation, even when employers do not respond. Jmail is designed to reduce that avoidable admin and cognitive load by organizing suitable vacancies and preparing materials for review. It cannot change employer response rates, remove uncertainty from a job search, or guarantee time savings; these outcomes have not been measured in a user study.

From an Operations Analytics and Business Analysis perspective, the project demonstrates workflow redesign, explicit decision criteria, exception recovery, data-flow trade-offs, and human control over a consequential process.

The project grew out of a UX problem: the earlier beta asked a new user to navigate too many technical setup steps before receiving a useful result. The current flow keeps setup in a guided web app and moves recurring controls to a dedicated automation page.

## Current user flow

1. The user opens the Jmail web app while signed in to their job-search Google account and grants the requested Google permissions.
2. Jmail creates a spreadsheet and document folder in that account.
3. The user enters their Gemini API key and consents to sending their CV, profile, criteria, and job-alert email content to Gemini.
4. The user uploads a CV, reviews and confirms the extracted profile, adjusts the match threshold and commute limit, then chooses **Apply**.
5. Jmail opens the final automation page. The user can run a check, enable or stop the daily trigger, open their files, revise settings, or remove Jmail data and access.

The final page does not automatically start an email scan. Suitable jobs are recorded in the user's sheet and relevant emails are archived; other or below-threshold messages are moved to Gmail Trash. Technical failures should leave a message available for a later run. This automated Trash behavior carries a false-positive risk, so use a separate Gmail account and check Trash when piloting.

## Architecture and data

- `index.html` is the public GitHub Pages landing page. `privacy.html` is the public multilingual privacy notice.
- `apps-script/full-port/` is the source of the deployed Apps Script web app. Google runs it as the account authorizing the app.
- Account settings, API key, profile, resource IDs, and run metadata are kept in Apps Script User Properties, scoped to the authorizing account. User-created sheets, folders, and PDFs live in that user's Google Drive.
- Gemini receives the data described in the in-app consent and [privacy notice](https://xurm1k.github.io/Jmail/privacy.html). A user-supplied key is required. Gemini's terms and quota rules are set by Google and may vary by region and tier.
- The automation can read and alter Gmail messages, create documents, and create drafts. It does not automatically send job applications.

The source includes a user-specific deletion flow that stops triggers, clears saved properties, attempts to remove Jmail labels and filters, restores labeled mail to Inbox, and moves Jmail files to Drive Trash. This is not a claim that third-party copies or already-sent Gemini requests can be recalled.

## Status and limits

The public web app is connected to an Apps Script deployment. The owner has exercised the workflow with a personal Google account; this does not constitute independent security review, Google OAuth verification, or multi-account isolation testing. Treat the project as a pilot, not a certified public service.

Google authorization screens remain part of setup. The public privacy page is a required transparency step for wider distribution, but does not complete OAuth review. Review Google's permission screen before granting access. The processing model and requested scopes should be reviewed before inviting a larger audience.

## Repository map

- [`apps-script/full-port/`](./apps-script/full-port/) — current full web app and worker source.
- [`apps-script/full-port/SETUP_RU.md`](./apps-script/full-port/SETUP_RU.md) — Russian setup notes.
- [`LIVE_TEST_RU.md`](./LIVE_TEST_RU.md) — pilot test guide and boundaries.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — current flow and architectural trade-offs.
- [`CHANGELOG.md`](./CHANGELOG.md) — beta-to-current product changes.
- [`docs/OPEN_SOURCE_ALTERNATIVES.md`](./docs/OPEN_SOURCE_ALTERNATIVES.md) — comparison with public job-search projects.
- [`PORTFOLIO_CASE_STUDY.md`](./PORTFOLIO_CASE_STUDY.md) — honest portfolio case study.
- [`docs/LINKEDIN_POST_RU.md`](./docs/LINKEDIN_POST_RU.md) and [`assets/portfolio/jmail-linkedin-carousel.html`](./assets/portfolio/jmail-linkedin-carousel.html) — post draft and carousel.
- [`docs/LINKEDIN_POST_EN.md`](./docs/LINKEDIN_POST_EN.md) — English LinkedIn version.

## Development

The synthetic scripts in `apps-script/full-port/` use stubs and fixtures; they do not verify live Google permissions, a real inbox, or Gemini behavior. Do not commit real resumes, Gmail messages, OAuth credentials, API keys, or account-specific files. See [privacy](https://xurm1k.github.io/Jmail/privacy.html) before using real personal data.
