// ==========================================
// SHEETMANAGER.GS — РАБОТА С GOOGLE SHEETS
// ==========================================
function getActiveMonthlySheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const now = new Date();
  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const sheetName = monthNames[now.getMonth()] + " " + now.getFullYear();
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    const sheets = ss.getSheets();
    const templateSheet = sheets.length > 0 ? sheets[0] : null;
    sheet = ss.insertSheet(sheetName);
    
    if (templateSheet && templateSheet.getLastRow() > 0) {
      const headerRange = templateSheet.getRange(1, 1, 1, templateSheet.getLastColumn());
      headerRange.copyTo(sheet.getRange(1, 1));
    } else {
      sheet.appendRow(["Datum", "Firma", "Bereich", "Quelle", "Status", "Kanal", "Match Score", "CV-Vorlage", "Kontakt E-Mail"]);
    }
  }
  return sheet;
}

function writeToActiveMonthlySheet(aiData) {
  const sheet = getActiveMonthlySheet();
  const tracker = aiData.tracker_data;
  
  const rowData = [
    tracker.date,
    tracker.company || "Unbekannt",
    tracker.bereich || "Office",
    tracker.source || "Email-Alert",
    false, // Чекбокс
    tracker.channel || "Website",
    aiData.match_score + "%",
    aiData.template_used || "Custom-AI",
    aiData.contact_email || "-"
  ];
  
  sheet.appendRow(rowData);
  
  const lastRow = sheet.getLastRow();
  const statusCell = sheet.getRange(lastRow, 5);
  statusCell.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
}

function checkAndCreateMonthlySheet() {
  getActiveMonthlySheet();
}

function getRecentApplicationsFromSheet(daysLimit) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheets = ss.getSheets();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysLimit);
    let applications = [];
    
    for (let s = 0; s < sheets.length; s++) {
      const data = sheets[s].getDataRange().getValues();
      if (data.length <= 1) continue;

      for (let i = 1; i < data.length; i++) {
        let rowDate = parseSheetDate(data[i][0]);
        const companyName = data[i][1];
        const bereich = data[i][2];
        
        if (rowDate && companyName && rowDate >= cutoffDate) {
          applications.push({
            company: String(companyName).toLowerCase().trim(),
            bereich: String(bereich || "").toLowerCase().trim()
          });
        }
      }
    }
    return applications;
  } catch (e) {
    Logger.log("Не удалось прочитать историю вакансий для проверки дублей: " + e.toString());
    throw e;
  }
}

function parseSheetDate(rowDateRaw) {
  if (rowDateRaw instanceof Date) return rowDateRaw;
  if (typeof rowDateRaw === 'string' && rowDateRaw.includes('.')) {
    const parts = rowDateRaw.split(".");
    if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return null;
}

function checkAndSendMonthlyCareerReport() {
  try {
    const now = new Date();
    if (now.getDate() > 7) return;

    const scriptProps = PropertiesService.getScriptProperties();
    const currentMonthKey = now.getFullYear() + "-" + (now.getMonth() + 1);
    if (scriptProps.getProperty("LAST_CAREER_REPORT_MONTH") === currentMonthKey) return;

    const pastMonthData = getPastMonthDataFromSheet(now);
    if (pastMonthData.length === 0) return;

    const reportText = generateCareerAdviceWithGemini(pastMonthData);
    if (!reportText) return;

    const subject = "📊 Карьерный отчет, конверс-фидбек и стратегия - Job Automation";
    const fullBody = reportText + "\n\nС уважением,\nВаш Gemini";
    
    GmailApp.sendEmail(CONFIG.USER_EMAIL, subject, fullBody);
    scriptProps.setProperty("LAST_CAREER_REPORT_MONTH", currentMonthKey);
  } catch (e) {}
}

function getPastMonthDataFromSheet(now) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    const sheet = ss.getSheetByName(monthNames[targetMonth] + " " + targetYear);
    
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    const results = [];
    for (let i = 1; i < data.length; i++) {
      results.push({ date: data[i][0], company: data[i][1], bereich: data[i][2], source: data[i][3], status: data[i][4] });
    }
    return results;
  } catch (e) {
    return [];
  }
}

