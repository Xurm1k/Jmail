// ==========================================
// UI.GS — МЕНЮ, ТРИГГЕРЫ И ОЧИСТКА
// ==========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 Job Automation')
    .addItem('🚀 Запустить обработку вакансий', 'processJobEmails')
    .addItem('🧹 Очистить неподтвержденные строки и архив', 'manualCleanupAction')
    .addToUi();
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
