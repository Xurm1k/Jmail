# Jmail

**Status: the public onboarding page is connected to a deployed Google Apps Script Web App, but the complete setup flow, permissions, and account isolation have not yet been verified. Treat Jmail as a prototype, not a production-ready service.**

Jmail explores how to reduce repetitive work in reviewing job-alert email and preparing application materials. The repository contains a public onboarding page and several Google Apps Script worker variants. A configured Web App URL now connects the page's setup button to Google AccountChooser; this confirms the handoff is configured, not that a user setup has completed successfully.

## What it is intended to do

A user selects their own Google account, sets criteria, and supplies a Gemini API key. Google Apps Script reviews job-alert email, records results, and prepares materials for human review. Applications are not submitted automatically.

The shared Web App is intended to run as **User accessing the web app**. The full-port script in `apps-script/full-port/Code.gs` uses Apps Script User Properties for account-specific settings and credentials. The repository also contains a separate legacy worker in `apps-script/Code.gs` with a different setup model; these deployment paths are not interchangeable.

## Current limitations

- The public landing page and `webapp-config.js` now contain a configured Web App URL, and the setup button routes through Google AccountChooser. The complete setup and processing path has not been verified with a dedicated test account.
- The deployed script version, execution identity, OAuth scopes, multi-user isolation, consent, and data-retention behavior need end-to-end verification. Source code and a working link do not prove these behaviors.
- The current classifier can move messages it considers unrelated or unsuitable to Gmail Trash. A false positive could hide a relevant vacancy. Before any wider use, replace automatic Trash actions with a review or quarantine step and a clear recovery path.
- Email text, CV content, and criteria are sent to Google Gemini. Do not use information that you are not prepared to send to that service.
- Google may show an unverified-app warning until the owner completes OAuth verification.
- Gemini quotas and terms may change.

## Setup and materials

The owner has configured a Google Apps Script Web App URL in `webapp-config.js`. Before relying on the workflow, verify the deployed version and complete setup with a dedicated Google account and a separate test Gmail inbox. Review the permissions shown by Google before granting access.

- [Setup and test instructions](./LIVE_TEST_RU.md)
- [Portfolio case study and project status](./PORTFOLIO_CASE_STUDY.md)

Synthetic scripts in `apps-script/full-port/` use Google API stubs; they do not prove a live multi-user deployment.
