# Jmail — simplifying a job-search automation setup

## Project

Jmail is a Google Apps Script web app for people who receive job alerts by email. It compares recent Gmail messages with a user's CV and job criteria, records suitable vacancies in a personal Google Sheet, and prepares application materials. It does not submit applications automatically.

**Role:** product owner and workflow designer; AI-assisted implementation and iteration.

**Status:** active pilot. Not OAuth-verified or independently security-audited.

## The problem I kept noticing

The beta was doing its main technical job: generate an Apps Script. But the path to use that script still asked a job seeker to behave like a developer—move between tools, understand what to paste where, set up Google resources, and hope the pieces connected. That felt like the wrong first experience for someone who came to reduce job-search work.

I did not have a research cohort or measured usability study to point to. This redesign started with a product question from using the flow myself: **how quickly can someone get from “I need help sorting job alerts” to a clear, usable control screen?**

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

An automation can be technically capable and still feel unusable if its setup makes the person assemble the system. Product work here meant reducing handoffs, making the transition from setup to everyday use explicit, and keeping destructive actions visually distinct.

## Evidence and next steps

The owner has tried the app with a personal Google account and reported successful processing runs. There is no documented user cohort, measured time saving, accuracy benchmark, or independent security review. Next work should validate the Apply path with a fresh account, measure setup completion and failure points, and improve recovery for emails that AI sends to Trash.

## Portfolio summary

> I redesigned a Gmail job-alert automation around the job seeker's actual first-use journey: guided account setup, CV-based matching, one clear Apply action, and a dedicated workspace for recurring controls. I focused on reducing technical handoffs while surfacing the remaining Google permissions, Gemini data flow, and risks of automated email decisions.
