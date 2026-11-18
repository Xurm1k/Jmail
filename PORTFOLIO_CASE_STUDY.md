# Portfolio case study: Jmail Job Automation Wizard

## The project

Jmail is a browser-based setup wizard for a personalized job-application workflow. Rather than asking users to edit a long script by hand, it guides them through six configuration steps and generates Google Apps Script code they can copy into their own Apps Script project.

The wizard is a front end for configuration and code generation. The generated script runs in the user's Google Workspace after they install and authorize it.

## What the wizard does

- Guides users through Gmail labels, Gemini API access, Drive, commute preferences, match thresholds, spreadsheet columns, and applicant details.
- Supports seven interface languages.
- Lets users configure transport modes, travel limits, match thresholds, blacklist terms, and target language.
- Generates a tailored Apps Script configuration and workflow code.
- Saves selected non-sensitive form settings in browser local storage while clearing the API key and applicant contact and resume fields from the saved copy.
- Provides a step-by-step setup flow and a copy-to-clipboard action for the generated code.

## A decision I had to make

I treated setup as a sequence of small decisions rather than a single code block. The stepper makes the external dependencies visible—Gmail labels, Drive folder, spreadsheet, and API key—before the user reaches code generation.

The wizard clears credentials and applicant-identifying fields from its saved browser copy. Those values can still appear in the generated code that the user copies, so the setup instructions and the user's handling of that output matter. Code generation itself does not install or authorize the script; the user must review it and complete those steps in Google Apps Script.

## What I personally contributed

- Identified setup friction in configuring a multi-service job-application workflow.
- Designed the six-step configuration flow and the options exposed to users.
- Connected the form state to generated Apps Script code, including criteria, applicant profile, and Google Workspace settings.
- Added multilingual interface content and a copy-ready installation path.
- Considered what form values should persist in the browser and cleared sensitive fields from the saved form snapshot.

I used AI-assisted coding where helpful. My contribution was the product framing, setup flow, configuration choices, and review of how the generated output maps to the user's workflow.

## Limits

The wizard does not verify that entered IDs, credentials, filters, or generated code are correct. The generated script has the permissions and behavior granted in the user's Google account, so it must be reviewed before installation. A locally saved browser configuration is not a secure secret store, and the generated code can contain personal information and credentials if copied with those values.

## What I would do next

1. Add a final review screen that highlights sensitive values before code generation.
2. Offer a download option and clear guidance for storing generated configuration securely.
3. Validate required fields and common Google Drive, Sheets, and email inputs.
4. Add a safe demo mode with synthetic applicant and vacancy data.
5. Test the full setup flow on mobile and document permissions granted to Apps Script.

## How I would present it in an interview

Describe the wizard as a usability layer around an existing automation: it translates setup requirements into a guided form and produces code that users can inspect and install. Demonstrate how the six steps reduce configuration friction, then explain the boundary between generating code and executing it, including how you considered sensitive values.

## Resume wording

- Designed a multilingual browser wizard that guides users through job-search workflow configuration and generates personalized Google Apps Script code.
- Translated Gmail, Gemini, Drive, and Sheets setup requirements into a six-step flow with configurable screening criteria.
- Added browser persistence that excludes credentials and applicant contact and resume fields from the saved form snapshot.
