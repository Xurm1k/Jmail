// ==========================================
// UI.GS — МЕНЮ, ТРИГГЕРЫ И ОЧИСТКА
// ==========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🤖 Jmail")
    .addItem("Открыть приложение Jmail", "showJmailWebAppLink")
    .addItem("Проверить новые письма", "processJobEmails")
    .addItem("🧹 Очистить обработанное и неоткликнувшиеся строки", "manualJmailCleanupAction")
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

function manualJmailCleanupAction() {
  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert("Очистить Jmail?", "В корзину будут перемещены письма с ярлыком Jmail/Processed и созданные Jmail документы. Загруженное фото сохранится. Дополнительно будут удалены строки с неотмеченным чекбоксом.", ui.ButtonSet.OK_CANCEL);
  if (answer !== ui.Button.OK) return;
  const result = cleanupJmailProcessedAndFiles(true);
  ui.alert("Очистка завершена. Письма в корзине: " + result.emails + "; файлов в корзине: " + result.files + "; строк удалено: " + result.rows + ".");
}


