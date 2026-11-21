/**
 * User-facing Jmail setup for a web-app deployment that executes as the user accessing it.
 * Each account's API key, profile, settings, and resource IDs live in User Properties.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("WebApp")
    .setTitle("Jmail — помощник по поиску работы")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function migrateJmailResourceNames_() {
  const p = jmailProps_();
  if (p.getProperty("JMAIL_RESOURCE_NAMES_MIGRATED_V1") === "yes") return;
  const folderId = p.getProperty("PDF_FOLDER_ID");
  if (folderId) {
    try { DriveApp.getFolderById(folderId).setName("Jmail Application Documents"); } catch (e) {}
  }
  const mapping = {"Jmail/Вакансии":"Jmail/Jobs", "Jmail/Обработано":"Jmail/Processed", "Jmail/Проверить":"Jmail/Review"};
  const labels = Gmail.Users.Labels.list("me").labels || [];
  Object.keys(mapping).forEach(oldName => {
    const item = labels.find(label => label.name === oldName);
    const destination = GmailApp.getUserLabelByName(mapping[oldName]);
    if (item && destination) {
      const source = GmailApp.getUserLabelByName(oldName);
      for (let offset = 0; ; offset += 100) {
        const batch = source.getThreads(offset, 100);
        if (!batch.length) break;
        destination.addToThreads(batch);
        if (batch.length < 100) break;
      }
      source.deleteLabel();
    } else if (item) Gmail.Users.Labels.update(Object.assign({}, item, {name:mapping[oldName]}), "me", item.id);
  });
  const settings = readJmailJson_("JMAIL_SETTINGS_JSON", {});
  Object.keys(mapping).forEach(key => {
    const field = key.endsWith("Вакансии") ? "inputLabel" : (key.endsWith("Обработано") ? "processedLabel" : "reviewLabel");
    if (!settings[field] || settings[field] === key) settings[field] = mapping[key];
  });
  p.setProperty("JMAIL_SETTINGS_JSON", JSON.stringify(settings));
  p.setProperty("JMAIL_RESOURCE_NAMES_MIGRATED_V1", "yes");
}

function getJmailSetupStatus() {
  const p = jmailProps_();
  migrateJmailResourceNames_();
  const settings = readJmailJson_("JMAIL_SETTINGS_JSON", {});
  const sender = readJmailJson_("JMAIL_SENDER_JSON", {});
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
    hasDataConsent: p.getProperty("GEMINI_DATA_CONSENT") === "yes",
    hasProfile: Boolean(p.getProperty("CAREER_PROFILE_JSON")),
    dailyEnabled: ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "processJobEmails" && t.getEventType() === ScriptApp.EventType.CLOCK),
    lastRun: readJmailJson_("last_run_stats", null),
    lastRunAt: p.getProperty("last_run_timestamp") || "",
    profileSettings: {
      name: sender.name || "", email: sender.email || settings.userEmail || "",
      phone: sender.phone || "", city: sender.city || sender.address || "",
      jobCriteria: settings.jobCriteria || "", minMatchScore: Number(settings.minMatchScore || 85),
      maxCommuteMinutes: Number(settings.maxCommuteMinutes || 60)
    }
  };
}

/** Removes this user's Jmail data, resources, labels, filters, triggers, and script authorization. */
function deleteJmailUserData() {
  const p = jmailProps_();
  const warnings = [];
  const spreadsheetId = p.getProperty("SPREADSHEET_ID");
  const folderId = p.getProperty("PDF_FOLDER_ID");
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "processJobEmails")
    .forEach(t => ScriptApp.deleteTrigger(t));
  try {
    const labels = Gmail.Users.Labels.list("me").labels || [];
    const jmailLabels = labels.filter(label => ["Jmail/Jobs", "Jmail/Processed", "Jmail/Review"].includes(label.name));
    const labelIds = jmailLabels.map(label => label.id);
    if (labelIds.length) {
      const filters = Gmail.Users.Settings.Filters.list("me").filter || [];
      filters.filter(filter => (filter.action && (filter.action.addLabelIds || []).some(id => labelIds.includes(id))))
        .forEach(filter => Gmail.Users.Settings.Filters.remove("me", filter.id));
      jmailLabels.forEach(label => {
        const userLabel = GmailApp.getUserLabelByName(label.name);
        if (userLabel) userLabel.deleteLabel();
      });
    }
  } catch (e) { warnings.push("Не удалось удалить некоторые ярлыки или фильтры Gmail."); }
  if (spreadsheetId) {
    try { DriveApp.getFileById(spreadsheetId).setTrashed(true); }
    catch (e) { warnings.push("Не удалось переместить таблицу Jmail в корзину."); }
  }
  if (folderId) {
    try { DriveApp.getFolderById(folderId).setTrashed(true); }
    catch (e) { warnings.push("Не удалось переместить папку Jmail в корзину."); }
  }
  p.deleteAllProperties();
  try { ScriptApp.invalidateAuth(); }
  catch (e) { warnings.push("Откройте настройки Google-аккаунта и отзовите доступ Jmail вручную."); }
  return {deleted: true, warnings: warnings};
}




