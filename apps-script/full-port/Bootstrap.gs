/**
 * First-run setup for the per-user full workflow.
 * Run setupJmail() once; inspect the created spreadsheet/folder links in Executions.
 */
function setupJmail() {
  const p = PropertiesService.getScriptProperties();
  const settings = readJmailJson_("JMAIL_SETTINGS_JSON", {});
  const inputName = settings.inputLabel || "Jmail/Вакансии";
  const processedName = settings.processedLabel || "Jmail/Обработано";
  const reviewName = settings.reviewLabel || "Jmail/Проверить";
  const ss = SpreadsheetApp.create("Jmail — вакансии");
  const sheet = ss.getSheets()[0];
  sheet.setName("Vorlage");
  sheet.appendRow(["Datum", "Firma", "Bereich", "Quelle", "Status", "Kanal", "Match Score", "CV-Vorlage", "Kontakt E-Mail"]);
  const folder = DriveApp.createFolder("Jmail — Bewerbungsunterlagen");
  p.setProperty("SPREADSHEET_ID", ss.getId());
  p.setProperty("PDF_FOLDER_ID", folder.getId());
  [inputName, processedName, reviewName].forEach(n => {
    if (!GmailApp.getUserLabelByName(n)) GmailApp.createLabel(n);
  });
  ScriptApp.newTrigger("onOpen").forSpreadsheet(ss).onOpen().create();
  ScriptApp.newTrigger("onEdit").forSpreadsheet(ss).onEdit().create();
  console.log("Jmail spreadsheet: " + ss.getUrl());
  console.log("Jmail Drive folder: " + folder.getUrl());
  console.log("Setup complete. Next: set private profile/key/settings, then run processJobEmails manually.");
}

function installJmailDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "processJobEmails")
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("processJobEmails").timeBased().everyDays(1).atHour(8).create();
}

function removeJmailDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "processJobEmails")
    .forEach(t => ScriptApp.deleteTrigger(t));
}