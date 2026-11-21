// ==========================================
// UI.GS — МЕНЮ, ТРИГГЕРЫ И ОЧИСТКА
// ==========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🤖 Jmail")
    .addItem("Открыть приложение Jmail", "showJmailWebAppLink")
    .addItem("Проверить новые письма", "processJobEmails")
    .addItem("Включить ежедневный запуск", "installJmailDailyTriggerFromSheet")
    .addItem("Остановить ежедневный запуск", "removeJmailDailyTriggerFromSheet")
    .addToUi();
}
function showJmailWebAppLink() {
  const url = ScriptApp.getService().getUrl();
  if (!url) {
    SpreadsheetApp.getUi().alert("Сначала владелец должен развернуть Jmail как веб-приложение.");
    return;
  }
  const html = HtmlService.createHtmlOutput('<p>Настройки и профиль Jmail:</p><p><a target="_blank" href="' + url + '">Открыть Jmail</a></p>');
  SpreadsheetApp.getUi().showModalDialog(html, "Jmail");
}
function installJmailDailyTriggerFromSheet() {
  installJmailDailyTrigger();
  SpreadsheetApp.getUi().alert("Ежедневный запуск включён. Автоматизация будет выполняться примерно в 08:00.");
}

function removeJmailDailyTriggerFromSheet() {
  removeJmailDailyTrigger();
  SpreadsheetApp.getUi().alert("Ежедневный запуск остановлен.");
}

/**
 * Безопасный обработчик клика по чекбоксу (OnEdit Trigger)
 */
function onEdit(e) {
  // Защита от ошибок, если событие вызвано вручную или криво
  if (!e || !e.range) return;

  const range = e.range;
  const sheet = range.getSheet();
  const col = range.getColumn();
  const row = range.getRow();

  // Проверяем: строка ниже шапки (row > 1) и 5-я колонка (Status / чекбокс)
  if (row > 1 && col === 5) {
    const value = range.getValue();
    
    // Если галочка поставлена (true)
    if (value === true) {
      range.clearContent();       // Очищаем чекбокс
      range.clearDataValidations();// Убираем валидацию чекбокса
      range.clearFormat();        // Сбрасываем любые кастомные стили и цвета в стандартные!
      range.setValue("Beworben"); // Записываем обычным стандартным шрифтом
    }
  }
}

function manualCleanupAction() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    let deletedRowsCount = 0;
    for (let i = data.length - 1; i >= 1; i--) {
      const statusCell = sheet.getRange(i + 1, 5);
      const statusValue = statusCell.getValue();
      
      if (statusValue === false || statusValue === "" || statusValue === "Unconfirmed") {
        sheet.deleteRow(i + 1);
        deletedRowsCount++;
      }
    }

    let countFiles = 0;
    if (CONFIG.PDF_FOLDER_ID) {
      const folder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);
      const files = folder.getFiles();
      while (files.hasNext()) {
        files.next().setTrashed(true);
        countFiles++;
      }
    }

    const processedLabel = GmailApp.getUserLabelByName(CONFIG.GMAIL_LABEL_PROCESSED);
    let countThreads = 0;
    if (processedLabel) {
      const threads = processedLabel.getThreads();
      for (let j = 0; j < threads.length; j++) {
        threads[j].moveToTrash();
        countThreads++;
      }
    }

    SpreadsheetApp.getUi().alert(`✅ Очистка завершена!\n• Удалено строк в таблице: ${deletedRowsCount}\n• Удалено файлов с Диска: ${countFiles}\n• Очищено писем в Gmail Fertig: ${countThreads}`);
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ Ошибка при очистке: " + err.toString());
  }
}

