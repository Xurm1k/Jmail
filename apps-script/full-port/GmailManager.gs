// Gmail helpers for classifying and handling job-alert messages.
function escapeHtmlForEmail(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isAutoReply(subject, body) {
  const text = (String(subject || "") + " " + String(body || "")).toLowerCase();
  return text.includes("eingangsbestätigung") ||
    text.includes("vielen dank für ihre bewerbung") ||
    text.includes("successfully applied") ||
    text.includes("is an auto-reply");
}

function createDirectNotificationInFertig(aiData, processedLabel, jobUrl) {
  const tracker = aiData.tracker_data || {};
  const company = tracker.company || "Firma";
  const bereich = tracker.bereich || "Position";
  const subject = `✅ [Матч из рассылки] ${company} - ${bereich}`;
  const plainBody = `Компания: ${company}\nДолжность: ${bereich}\nСсылка на вакансию: ${jobUrl || "Не найдена в письме"}\nДата: ${tracker.date || ""}\nСтатус: Обработано автоматически.`;
  const safeUrl = /^https?:\/\//i.test(String(jobUrl || "")) ? String(jobUrl) : "";
  const linkHtml = safeUrl
    ? `<a href="${escapeHtmlForEmail(safeUrl)}">${escapeHtmlForEmail(safeUrl)}</a>`
    : "Не найдена в письме";
  const htmlBody = `<b>Компания:</b> ${escapeHtmlForEmail(company)}<br><b>Должность:</b> ${escapeHtmlForEmail(bereich)}<br><b>Ссылка на вакансию:</b> ${linkHtml}<br><b>Дата:</b> ${escapeHtmlForEmail(tracker.date || "")}<br><br><i>Статус: Обработано автоматически.</i>`;

  // GmailApp.sendEmail does not return the sent message. Sending a draft returns it,
  // allowing the script to label and archive the notification reliably.
  const sentMessage = GmailApp.createDraft(CONFIG.USER_EMAIL, subject, plainBody, { htmlBody: htmlBody }).send();
  const sentThread = sentMessage.getThread();
  if (processedLabel) sentThread.addLabel(processedLabel);
  sentThread.moveToArchive();
  return sentThread;
}

function createGmailDraftWithUniqueCV(aiData, originalSubject) {
  if (!aiData.contact_email) return null;
  if (!aiData.cvPdfFileId) throw new Error("CV PDF ID is missing; refusing to create a draft without the current CV.");

  const cvFile = DriveApp.getFileById(aiData.cvPdfFileId);
  const subject = "Bewerbung als " + (aiData.tracker_data.bereich || "Mitarbeiter") + " - " + CONFIG.SENDER_INFO.name;
  const body = signedCoverLetterText_(aiData.cover_letter || "");
  return GmailApp.createDraft(aiData.contact_email, subject, body, {
    attachments: [cvFile.getBlob()]
  });
}

