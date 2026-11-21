function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeBrandColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || "")) ? value : "#1a365d";
}

function getDocumentThemeColor(theme) {
  const palettes = {
    navy: "#183153",
    teal: "#0f766e",
    olive: "#596839",
    graphite: "#374151",
    burgundy: "#7e2d45"
  };
  return palettes[theme] || palettes.navy;
}
function generateUniqueCvPDF(aiData) {
  const documentData = aiData.cv_document || {};
  const brandColor = getDocumentThemeColor(documentData.design_theme);
  const photoStyle = ['square', 'rounded', 'circle'].includes(documentData.photo_style)
    ? documentData.photo_style
    : 'rounded';

  const selectedClaims = {};
  (documentData.experience_selections || []).forEach(selection => {
    selectedClaims[selection.experience_id] = selection.claim_ids || [];
  });
  const experienceHtml = CAREER_PROFILE.experiences.map(experience => {
    const selectedIds = selectedClaims[experience.id] || [];
    const claimTextById = {};
    experience.claims.forEach(claim => { claimTextById[claim.id] = claim.text; });
    const claimHtml = selectedIds
      .filter(id => claimTextById[id])
      .map(id => '<li>' + escapeHtml(claimTextById[id]) + '</li>')
      .join('');
    return '<article class="experience">' +
      '<div class="experience-head"><div><div class="role">' + escapeHtml(experience.role) + '</div>' +
      '<div class="company">' + escapeHtml(experience.company) + ' · ' + escapeHtml(experience.location) + '</div></div>' +
      '<div class="period">' + escapeHtml(experience.period) + '</div></div>' +
      (claimHtml ? '<ul>' + claimHtml + '</ul>' : '') +
      '</article>';
  });

  const gap = CAREER_PROFILE.optionalCareerTransition;
  const transitionHtml = documentData.include_career_transition && gap
    ? '<article class="experience transition"><div class="experience-head"><div><div class="role">' +
      escapeHtml(gap.title) + '</div><div class="company">Berufliche Phase</div></div><div class="period">' +
      escapeHtml(gap.period) + '</div></div><ul><li>' + escapeHtml(gap.claim) + '</li></ul></article>'
    : '';

  const military = CAREER_PROFILE.militaryService;
  const militaryHtml = '<article class="experience"><div class="experience-head"><div><div class="role">' +
    escapeHtml(military.role) + '</div><div class="company">' + escapeHtml(military.company) +
    '</div></div><div class="period">' + escapeHtml(military.period) + '</div></div></article>';
  const orderedExperienceHtml = [];
  if (transitionHtml) orderedExperienceHtml.push(transitionHtml);
  CAREER_PROFILE.experiences.forEach(experience => {
    if (experience.id === 'sales_customer_experience') orderedExperienceHtml.push(militaryHtml);
    orderedExperienceHtml.push(experienceHtml[CAREER_PROFILE.experiences.indexOf(experience)]);
  });

  const defaultSkillIds = ['customer_service', 'quality_management', 'team_leadership', 'process_optimization', 'crm_office', 'reliability'];
  const skillMap = {};
  CAREER_PROFILE.skills.forEach(skill => { skillMap[skill.id] = skill.text; });
  let selectedSkillIds = (documentData.skill_ids || []).filter(id => skillMap[id]).slice(0, 8);
  if (!selectedSkillIds.length) selectedSkillIds = defaultSkillIds;
  const skillsHtml = selectedSkillIds.map(id => '<li>' + escapeHtml(skillMap[id]) + '</li>').join('');
  const languagesHtml = CAREER_PROFILE.languages
    .map(language => '<span class="language"><strong>' + escapeHtml(language.label) + ':</strong> ' + escapeHtml(language.level) + '</span>')
    .join('');

  const educationHtml = CAREER_PROFILE.education.map(item =>
    '<article class="education"><div class="experience-head"><div><div class="role">' +
    escapeHtml(item.title) + '</div><div class="company">' + escapeHtml(item.institution) +
    ' · ' + escapeHtml(item.location) + '</div></div><div class="period">' +
    escapeHtml(item.period) + '</div></div></article>'
  ).join('');

  let photoBase64 = '';
  try {
    const photoFile = DriveApp.getFileById(CONFIG.PHOTO_FILE_ID);
    const photoBlob = photoFile.getBlob();
    photoBase64 = 'data:' + photoBlob.getContentType() + ';base64,' + Utilities.base64Encode(photoBlob.getBytes());
  } catch (e) {}

  const safeCompany = String((aiData.company_address || {}).name || aiData.tracker_data.company || 'Unternehmen')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
  const htmlContent = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    '@page{size:A4;margin:14mm 15mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;line-height:1.38;color:#202833;margin:0}' +
    '.header{border-bottom:3px solid ' + brandColor + ';padding-bottom:12px;margin-bottom:15px}.header-table{width:100%;border-collapse:collapse}.photo-cell{width:102px;vertical-align:top}' +
    '.photo{object-fit:cover;border:1px solid #d1d5db}.photo.square{width:82px;height:106px;border-radius:0}.photo.rounded{width:82px;height:106px;border-radius:9px}.photo.circle{width:90px;height:90px;border-radius:50%}' +
    '.photo-placeholder{width:82px;height:106px;background:#eef1f4;color:#667085;text-align:center;padding-top:44px;border-radius:8px}.info-cell{vertical-align:top;padding-left:14px}' +
    '.name{font-size:21pt;font-weight:700;color:' + brandColor + ';margin:0 0 4px}.target{font-size:11.5pt;font-weight:700;margin:0 0 8px}.contact{font-size:8.5pt;color:#46505c;line-height:1.45}' +
    '.section-title{font-size:11pt;font-weight:700;color:' + brandColor + ';margin:14px 0 7px;padding-bottom:3px;border-bottom:1px solid #cbd2d9;text-transform:uppercase;letter-spacing:.35px}' +
    '.summary{font-size:9.5pt;margin:0}.experience,.education{margin:0 0 8px;page-break-inside:avoid}.experience-head{display:flex;justify-content:space-between;gap:10px;align-items:baseline}' +
    '.role{font-weight:700;font-size:10pt}.company{font-size:8.5pt;color:#596575;margin-top:1px}.period{font-size:8.5pt;color:#596575;white-space:nowrap;text-align:right}' +
    'ul{margin:3px 0 4px 16px;padding:0}li{margin:0 0 2px;padding-left:1px}.skill-list{columns:2;column-gap:25px}.skill-list li{break-inside:avoid}.languages{display:flex;flex-wrap:wrap;gap:5px 18px;font-size:9pt}' +
    '.footer-note{font-size:8pt;color:#687383;margin-top:10px}.transition{border-left:2px solid ' + brandColor + ';padding-left:8px}' +
    '</style></head><body>' +
    '<div class="header"><table class="header-table"><tr><td class="photo-cell">' +
    (photoBase64 ? '<img src="' + photoBase64 + '" class="photo ' + photoStyle + '">' : '<div class="photo-placeholder">Foto</div>') +
    '</td><td class="info-cell"><div class="name">' + escapeHtml(CONFIG.SENDER_INFO.name) + '</div>' +
    '<div class="target">' + escapeHtml(documentData.cv_headline || aiData.tracker_data.bereich || 'Bewerbung') + '</div>' +
    '<div class="contact">' + escapeHtml(CONFIG.SENDER_INFO.address) + '<br>' +
    escapeHtml(CONFIG.SENDER_INFO.phone) + ' · ' + escapeHtml(CONFIG.SENDER_INFO.email) + '</div></td></tr></table></div>' +
    '<section><h2 class="section-title">Profil</h2><p class="summary">' + escapeHtml(documentData.cv_summary || aiData.cv_summary || '') + '</p></section>' +
    '<section><h2 class="section-title">Berufserfahrung</h2>' + orderedExperienceHtml.join('') + '</section>' +
    '<section><h2 class="section-title">Ausbildung</h2>' + educationHtml + '</section>' +
    '<section><h2 class="section-title">Kenntnisse</h2><ul class="skill-list">' + skillsHtml + '</ul></section>' +
    '<section><h2 class="section-title">Sprachen</h2><div class="languages">' + languagesHtml + '</div></section>' +
    '</body></html>';

  const blob = Utilities.newBlob(htmlContent, 'text/html', 'Lebenslauf_' + safeCompany + '.html');
  const pdfBlob = blob.getAs(MimeType.PDF).setName('Lebenslauf_' + safeCompany + '.pdf');
  const folder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);
  const file = folder.createFile(pdfBlob);
  return file.getId();
}

// ==========================================
// ГЕНЕРАЦИЯ PDF ANSCHREIBEN
// ==========================================

function generateAnschreibenPDF(aiData) {
  const companyData = aiData.company_address || {};
  const tracker = aiData.tracker_data || {};
  const company = escapeHtml(companyData.name || tracker.company || "Firma");
  const street = companyData.street ? escapeHtml(companyData.street) + "<br>" : "";
  const city = escapeHtml(companyData.city || CONFIG.SENDER_INFO.city || "");
  const bereich = escapeHtml(tracker.bereich || "Mitarbeiter");
  const dateStr = escapeHtml(tracker.date);
  const brandColor = getDocumentThemeColor((aiData.cv_document || {}).design_theme);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #222222; margin: 40px; }
        .sender { font-size: 9pt; color: #555555; margin-bottom: 35px; border-bottom: 2px solid ${brandColor}; padding-bottom: 6px; }
        .recipient { margin-bottom: 35px; line-height: 1.4; }
        .date { text-align: right; margin-bottom: 30px; font-size: 10pt; color: #444444; }
        .subject { font-size: 12pt; font-weight: bold; margin-bottom: 25px; color: ${brandColor}; }
        .content { text-align: justify; white-space: pre-line; }
      </style>
    </head>
    <body>
      <div class="sender">
        <strong>${escapeHtml(CONFIG.SENDER_INFO.name)}</strong> • ${escapeHtml(CONFIG.SENDER_INFO.address)}<br>
        Telefon: ${escapeHtml(CONFIG.SENDER_INFO.phone)} • E-Mail: ${escapeHtml(CONFIG.SENDER_INFO.email)}
      </div>
      <div class="recipient">
        An die Personalabteilung<br><strong>${company}</strong><br>${street}${city}
      </div>
      <div class="date">${escapeHtml(CONFIG.SENDER_INFO.city || "")}, den ${dateStr}</div>
      <div class="subject">Bewerbung als ${bereich}</div>
      <div class="content">${escapeHtml(aiData.cover_letter)}</div>
    </body>
    </html>
  `;

  const blob = Utilities.newBlob(htmlContent, "text/html", `Anschreiben_${company.replace(/[^a-zA-Z0-9]/g, "_")}.html`);
  const pdfBlob = blob.getAs(MimeType.PDF);
  const folder = DriveApp.getFolderById(CONFIG.PDF_FOLDER_ID);
  const file = folder.createFile(pdfBlob);

  return file.getId();
}

// ==========================================
// СОЗДАНИЕ ЧЕРНОВИКА
// ==========================================


