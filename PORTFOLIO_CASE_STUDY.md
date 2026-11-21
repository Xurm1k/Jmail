# Portfolio Case Study: Jmail Job-Search Workflow Prototype

## Project overview

Jmail is an in-progress prototype exploring how a guided setup flow could connect a job seeker's criteria with recurring review of job-alert email. The intended workflow helps organize potentially relevant vacancies and prepare application materials while leaving the final decision and application submission to the person.

This case study describes the current repository state. It is not a claim that Jmail is a finished or publicly usable product.

## The operational problem

Job alerts arrive in different formats. A job seeker may repeatedly read messages, compare each role with personal criteria, copy details into a tracker, and prepare similar application documents. This creates avoidable review work, but fully automated decisions can also hide relevant messages or expose sensitive information.

The design goal is to reduce repetitive preparation while keeping review, correction, and the final application decision with the user.

## Current design

The repository contains a browser-based setup interface and Google Apps Script code intended to handle account-specific processing.

The documented multi-user design is:

- A project owner deploys one Google Apps Script Web App.
- Each user opens it while signed into their own Google account and grants Google permissions directly.
- The full-port script uses Apps Script User Properties for account-specific settings and credentials.
- A user supplies their own Gemini API key and configures job criteria and resume data.
- The workflow classifies recent job-alert email, records results in Google Sheets, and prepares application materials for review.
- Applications are not submitted automatically.

The project also contains a separate legacy Apps Script worker with a different setup model. The deployment paths should not be treated as interchangeable.

## Current status and verification boundary

The public onboarding flow is not connected to a deployed shared web app yet: `webapp-config.js` currently contains an empty deployment URL. The intended account-isolation model is documented and implemented in the full-port code, but this repository state alone does not prove a live multi-account deployment or a completed end-to-end user test.

The current processing code can move messages it classifies as unrelated or below the configured match threshold to Gmail Trash. A false positive could therefore hide a relevant vacancy. The project documentation advises using a dedicated Gmail account and checking early results. Before inviting outside users, a review/quarantine step should replace automatic Trash behavior and the account-isolation, permissions, recovery, and retention behavior should be verified in separate test accounts.

Email text, resume content, and criteria are sent to Google Gemini for classification or document preparation. Users need a clear explanation of this data flow and should use only information they are prepared to send to that service.

## My contribution

I framed the task as an operations workflow rather than an isolated AI prompt: define the user's criteria, reduce repeated triage and record-keeping, and retain a human review point before an application is sent.

I used AI-assisted development. My contribution includes the process requirements, onboarding flow, account-isolation expectations, review boundaries, and identification of failure and privacy risks that need to be addressed before a broader release.

## What this case demonstrates

- Translating a repetitive personal workflow into a step-by-step onboarding and processing flow.
- Separating account-specific user data from a shared application entry point in the intended deployment model.
- Keeping application submission under human control.
- Recognizing that a model classification can cause a consequential false positive when paired with destructive email actions.
- Distinguishing implemented code and documented design from verified deployment and product readiness.

## Next steps

1. Connect a deployed Apps Script Web App to the public setup flow and verify the full path with a dedicated test account.
2. Replace automatic Trash with a review label or quarantine and provide an undo/recovery path.
3. Verify that one user's settings, credentials, files, and email cannot be accessed by another user.
4. Review OAuth scopes, consent text, data retention, and the Gemini data flow.
5. Add repeatable tests for malformed messages, model errors, duplicate alerts, false positives, and setup failures.
6. Update this case study only after each behavior has been verified.

## Portfolio wording

- Designed an AI-assisted job-alert workflow prototype that connects configurable criteria, email review, application tracking, and draft generation while retaining human approval.
- Defined account-isolation and user-review requirements for a Google Apps Script deployment and documented the current verification boundary.
- Identified the risk of moving model-rejected messages to Trash and specified review and recovery safeguards for a safer next version.
