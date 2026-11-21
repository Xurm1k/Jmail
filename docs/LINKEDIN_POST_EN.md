# LinkedIn post draft — English

**Suggested first line:** A job-search tool should not begin by giving the job seeker another technical job.

I kept looking at the beta version of Jmail and getting stuck on the same thought: it could generate an automation script, but the person using it still had to do too much of the assembly.

Find the right screen. Copy the code. Set up the Google pieces. Work out what goes where. Only then get to the thing they came for: less time sorting job-alert emails.

That felt like a customer-experience problem before it felt like a missing AI feature.

So I changed the flow. Jmail now guides the user through connecting their own Google account, adding a Gemini key, uploading and reviewing a CV-based profile, and setting a match threshold and commute limit. The user presses **Apply** once the setup is ready, and lands on a separate automation page for running checks, managing the daily schedule, opening their files, or changing their settings.

The small design choice I care about most: Apply opens the workspace; it does not silently start reading email. The user chooses when to run it. Green, amber, blue, and red buttons also make the difference between run, stop, edit, and delete much clearer.

This came from my own friction with the beta, not a user study I haven't run. The live flow has been tried with my own Google account, but it still needs fresh-account testing and a proper review before I would call it production-ready.

There are still real trade-offs: Google authorization remains, users need their own Gemini key, email content is sent to Gemini with consent, and AI-rejected mail goes to Trash. Jmail does not apply to jobs on the user's behalf.

I’m learning that useful automation is not just about what the model can do. It is also about how much setup the person has to carry, whether they understand what will happen, and whether the next action feels safe.

That’s the direction I want to keep working in: product UX, practical automation, and AI features that explain their boundaries.

I’d love feedback on one question: **what would you need to see before trusting an assistant to sort job-alert email for you?**

#ProductDesign #UX #Automation #AppliedAI #JobSearch

## Carousel

The companion six-slide carousel is [`assets/portfolio/jmail-linkedin-carousel.pdf`](../assets/portfolio/jmail-linkedin-carousel.pdf). Its editable web source and reproducible PDF builder are in the same folder.
