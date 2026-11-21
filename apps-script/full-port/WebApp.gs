/**
 * User-facing Jmail setup for a web-app deployment that executes as the user accessing it.
 * Each account's API key, profile, settings, and resource IDs live in User Properties.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("WebApp")
    .setTitle("Jmail — помощник по поиску работы")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function getJmailSetupStatus() {
  const p = jmailProps_();
  const spreadsheetId = p.getProperty("SPREADSHEET_ID") || "";
  const folderId = p.getProperty("PDF_FOLDER_ID") || "";
  let spreadsheetUrl = "";
  let folderUrl = "";
  if (spreadsheetId) { try { spreadsheetUrl = SpreadsheetApp.openById(spreadsheetId).getUrl(); } catch (e) {} }
  if (folderId) { try { folderUrl = DriveApp.getFolderById(folderId).getUrl(); } catch (e) {} }
  return {
    ready: Boolean(spreadsheetUrl && folderUrl),
    spreadsheetUrl: spreadsheetUrl,
    folderUrl: folderUrl,
    hasApiKey: Boolean(p.getProperty("GEMINI_API_KEY")),
    hasProfile: Boolean(p.getProperty("CAREER_PROFILE_JSON")),
    dailyEnabled: ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "processJobEmails" && t.getEventType() === ScriptApp.EventType.CLOCK),
    lastRun: readJmailJson_("last_run_stats", null),
    lastRunAt: p.getProperty("last_run_timestamp") || ""
  };
}
