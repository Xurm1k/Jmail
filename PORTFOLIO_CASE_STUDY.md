# Jmail — simplifying a job-search automation setup

## Project

Jmail is a Google Apps Script web app for people who receive job alerts by email. It compares recent Gmail messages with a user's CV and job criteria, records suitable vacancies in a personal Google Sheet, and prepares application materials. It does not submit applications automatically.

**Role:** product owner and workflow designer; AI-assisted implementation and iteration.

**Status:** active pilot. Not OAuth-verified or independently security-audited.

Jmail is a guided Gmail job-alert assistant. A job seeker connects a separate Google account, adds a Gemini API key, uploads a CV, and sets job-fit and commute criteria. Jmail creates a personal Google Sheet and Drive folder, evaluates recent job-alert email, and prepares application material. The user reviews the results and decides which applications to send; Jmail does not submit applications automatically.

## User problem and portfolio value

A high volume of job alerts can mean repeated reading, matching, tracking, and document preparation, even when employers do not respond. Jmail is designed to reduce that avoidable admin and cognitive load by organizing suitable vacancies and preparing materials for review. It cannot change employer response rates, remove uncertainty from a job search, or guarantee time savings; these outcomes have not been measured in a user study.

From an Operations Analytics and Business Analysis perspective, the project demonstrates workflow redesign, explicit decision criteria, exception recovery, data-flow trade-offs, and human control over a consequential process.

## What changed

- Reframed the experience from “generate code” to a guided setup in the user's own Google account.
- Added automatic creation of the user's spreadsheet and Drive folder.
- Added CV upload, evidence-checked profile generation, and a review/confirm step.
- Kept match threshold, commute limit, job criteria, and contact details editable without rebuilding the whole setup.
- Changed the last wizard action to **Apply**. It saves settings, verifies that setup prerequisites are ready, then opens the final automation workspace. It does not unexpectedly start scanning email.
- Separated onboarding from the final page, where the user can run a check, enable/stop daily scheduling, open files, revise settings, and delete Jmail data.
- Restored distinct action colors: green for run/enable, amber for stop, blue for editing, and red for disconnect/delete.
- Added Russian, German, and English UI and a public multilingual privacy notice.

## Decisions and trade-offs

The automation runs through Apps Script as the Google account authorizing it. That avoids a Jmail-operated database of every user's Gmail content. The user still must grant Google permissions and provide a Gemini key; the UX is simpler than installing a script by hand, but it is not one-click or frictionless.

AI automatically decides whether a message matches the profile. Suitable messages go into the tracker; messages judged irrelevant or below the configured threshold are moved to Trash. That is a meaningful risk, so Jmail recommends a separate job-search Gmail account. The user remains responsible for reviewing the results and sending any application.

## What I learned

An automation can be technically capable and still feel unusable if its setup makes the person assemble the system. Product work here meant reducing handoffs, making the transition from setup to everyday use explicit, and keeping destructive actions visually distinct. For my Operations Analytics and Business Analysis profile, the case demonstrates process mapping, decision criteria, exception handling, QA-minded iteration, and the discipline to state what automation cannot solve.

## Evidence and next steps

The owner has tried the app with a personal Google account and reported successful processing runs. There is no documented user cohort, measured time saving, accuracy benchmark, or independent security review. Next work should validate the Apply path with a fresh account, measure setup completion and failure points, and improve recovery for emails that AI sends to Trash.

## Portfolio summary

> I redesigned a Gmail job-alert automation around the job seeker's actual first-use journey: guided account setup, CV-based matching, one clear Apply action, and a dedicated workspace for recurring controls. I focused on reducing technical handoffs while surfacing the remaining Google permissions, Gemini data flow, and risks of automated email decisions.
