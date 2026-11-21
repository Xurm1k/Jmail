// User-specific values and secrets are read from Script Properties, never committed here.
function readJmailJson_(key, fallback) {
  const raw = PropertiesService.getScriptProperties().getProperty(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch (e) { throw new Error("Invalid JSON in Script Property: " + key); }
}
const CONFIG = (function () {
  const p = PropertiesService.getScriptProperties();
  const settings = readJmailJson_("JMAIL_SETTINGS_JSON", {});
  const sender = readJmailJson_("JMAIL_SENDER_JSON", {});
  return {
    GEMINI_API_KEY: p.getProperty("GEMINI_API_KEY") || "",
    GEMINI_DOCUMENTS_MODEL: settings.geminiDocumentsModel || "gemini-3.5-flash",
    SPREADSHEET_ID: p.getProperty("SPREADSHEET_ID") || "",
    USER_EMAIL: settings.userEmail || Session.getEffectiveUser().getEmail() || "",
    GMAIL_LABEL_INPUT: settings.inputLabel || "Jmail/Вакансии",
    GMAIL_LABEL_PROCESSED: settings.processedLabel || "Jmail/Обработано",
    GMAIL_LABEL_REVIEW: settings.reviewLabel || "Jmail/Проверить",
    MIN_MATCH_SCORE: Number(settings.minMatchScore || 85),
    MAX_RUNTIME_SECONDS: Number(settings.maxRuntimeSeconds || 300),
    MIN_SECONDS_TO_START_JOB: Number(settings.minSecondsToStartJob || 150),
    THREADS_PAGE_SIZE: Number(settings.threadsPageSize || 100),
    MAX_COMMUTE_MINUTES: Number(settings.maxCommuteMinutes || 60),
    PDF_FOLDER_ID: p.getProperty("PDF_FOLDER_ID") || "",
    PHOTO_FILE_ID: p.getProperty("PHOTO_FILE_ID") || "",
    SENDER_INFO: sender
  };
})();