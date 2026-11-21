// Keep personal profile data in the user's private Apps Script properties, not in Git.
const CAREER_PROFILE = readJmailJson_("CAREER_PROFILE_JSON", {
  experiences: [], militaryService: {}, education: [], languages: [], skills: [],
  optionalCareerTransition: null
});