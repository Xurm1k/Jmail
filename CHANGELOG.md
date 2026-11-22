# Changelog

This log describes user-visible product stages. It does not imply that every release has passed OAuth review or an independent security audit.

## 2026-11-22 — cleanup controls and Drive-backed photo

- Keep the profile photo in the user's Jmail Drive folder during cleanup; generated application documents can be cleared without losing the reusable photo.
- Add a final-page action that moves Jmail/Processed threads and generated files to Trash while keeping spreadsheet history and the photo.
- Add a spreadsheet menu cleanup action that performs the same cleanup and removes only unchecked vacancy rows across monthly tabs; applied rows and the template are preserved.
- Remove the older broad cleanup implementation that could trash every file in the folder, including the photo.
- Confirm Job Automation still reads the resume photo by its Google Drive file ID, configured from the user's own Drive; its cleanup now preserves that photo.

## 2026-11-22 — processing and document reliability

- Added a Gmail-backed pending queue so temporary failures remain eligible for later runs instead of aging out after the one-day discovery window.
- Save every accepted vacancy to the spreadsheet before generating PDFs or drafts; show a separate count of rows actually recorded.
- Open the spreadsheet on the active monthly vacancy tab to avoid landing on the blank template tab.
- Format cover letters into readable paragraphs and add the applicant's typed closing and name to PDFs and drafts.
- Added an optional separate photo upload because the current browser import extracts PDF text but not its embedded portrait; uploaded photos stay in the user's Jmail Drive folder.
- Added Ukrainian, Polish, Turkish, Spanish, and French choices alongside Russian, German, and English. Untranslated interface messages fall back to English.
- Use an official company website only when a direct link appears in the alert email; extract a public theme color without sending the resume or message body to that site.
- Applied the spreadsheet-first and document-formatting fixes to the local Job Automation source as well.

## Beta — `Jmail_beta`

- Started as a code-generating setup concept: collect criteria and produce a Google Apps Script for the user to install.
- Exposed too many technical decisions and handoffs before the person could get to a usable automation. That setup burden became the main product problem to solve.
- Preserved as a separate historical branch rather than overwritten by the current direction.

## MVP — `Jmail_mvp`

- Introduced a browser wizard and a single-user-account Apps Script worker path.
- Added resume-based profile drafting, criteria, Gemini setup guidance, and Google-owned spreadsheet/folder creation.
- Connected the web interface to the user's Apps Script authorization and account, rather than requiring the person to edit generated source code.
- Began testing the real workflow with a dedicated Google account; this was pilot testing, not multi-account security verification.

## Current direction — guided setup plus automation dashboard

### 2026-11-21 · Apps Script release 19

The release number above is the Google Apps Script deployment version; GitHub source history remains tracked by commits.

- Replaced manual vacancy review with automatic AI classification according to the user's confirmed profile and criteria.
- Added a final automation page for manual runs, daily scheduling, file links, settings, and account-specific deletion.
- Added distinct button colors so run/enable, stop, edit, and destructive deletion actions are easier to tell apart.
- Changed the wizard's final section to **Apply**: persist profile criteria, validate prerequisites, and open the final automation page without launching a scan unexpectedly.
- Allowed criteria-only edits without re-uploading a CV. Replacing a CV still requires building and reviewing its profile before applying.
- Kept the previous approved profile if extraction or factual checking of a new CV fails.
- Normalized punctuation and line-break differences when checking extracted resume facts; still requires the claimed words to appear in the source text.
- Added multilingual privacy information and links from the public landing page and app.
- Added user-data deletion and recovery behavior for Jmail-labeled messages, subject to the limits described in the privacy notice.

## Known limits

- Google consent and a user-provided Gemini API key remain setup requirements.
- Non-matching mail is moved to Trash. A false positive can hide a relevant vacancy, so use a separate Gmail account and monitor Trash during pilot use.
- OAuth verification, full multi-account isolation checks, and independent security review are not complete.
- There are no public user-study results or measured time-saved claims in this log.

## Source milestones

The main-branch Git history records the implementation sequence: wizard setup (`ceea854`), inbox classification (`56b5a49`), account isolation (`d8deaa4`), Gemini guide (`0a81c99`), dashboard controls (`a196d9c`), labeled-message restore (`d85d7be`), separate automation page (`71deb12`), button styling (`8f9814d`), resume evidence fix and privacy page (`9e36e0a`), then the Apply-to-dashboard transition and criteria-only editing.

