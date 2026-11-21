// ==========================================
// MAIN.GS — ОСНОВНОЙ ОРКЕСТРАТОР ПРОЦЕССА
// ==========================================
function processJobEmails() {
  const lock = LockService.getUserLock ? LockService.getUserLock() : LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log("Пропуск запуска: другой экземпляр обработки уже работает.");
    return {status: "already_running"};
  }
  try {
    return processJobEmailsUnlocked();
  } finally {
    lock.releaseLock();
  }
}

function processJobEmailsUnlocked() {
  const startTime = Date.now();
  const stats = {
    threadsSeen: 0,
    analyzed: 0,
    selected: 0,
    completed: 0,
    rejected: 0,
    review: 0,
    errors: 0,
    stoppedForTime: false,
    status: "running"
  };

  try {
    if (!shouldContinueProcessing(startTime, 60, stats, "ежемесячные задачи")) return stats;
    checkAndCreateMonthlySheet();
    if (!shouldContinueProcessing(startTime, 60, stats, "ежемесячный отчет")) return stats;
    checkAndSendMonthlyCareerReport();

    let processedLabel = GmailApp.getUserLabelByName(CONFIG.GMAIL_LABEL_PROCESSED);
    if (!processedLabel) processedLabel = GmailApp.createLabel(CONFIG.GMAIL_LABEL_PROCESSED);
    let reviewLabel = GmailApp.getUserLabelByName(CONFIG.GMAIL_LABEL_REVIEW);
    if (!reviewLabel) reviewLabel = GmailApp.createLabel(CONFIG.GMAIL_LABEL_REVIEW);

    const recentApplications = getRecentApplicationsFromSheet(90);
    // Автоматически проверяем свежие письма во Входящих; входной ярлык вручную ставить не нужно.
    // Снимок собирается до изменения ярлыков, чтобы пагинация не пропускала письма.
    const threads = [];
    let snapshotComplete = false;
    for (let offset = 0; ; offset += CONFIG.THREADS_PAGE_SIZE) {
      if (!shouldContinueProcessing(startTime, 60, stats, "чтение писем")) break;
      const query = 'in:inbox newer_than:1d -label:"' + CONFIG.GMAIL_LABEL_PROCESSED + '" -label:"' + CONFIG.GMAIL_LABEL_REVIEW + '"';
      const page = GmailApp.search(query, offset, CONFIG.THREADS_PAGE_SIZE);
      threads.push.apply(threads, page);
      if (page.length < CONFIG.THREADS_PAGE_SIZE) {
        snapshotComplete = true;
        break;
      }
    }
    stats.threadsSeen = threads.length;
  
    if (threads.length === 0 && snapshotComplete) {
      const noJobsDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy");
      jmailProps_().setProperty("no_jobs_since", noJobsDate);
      stats.status = "no_emails";
      Logger.log('Новых писем во Входящих за последние сутки нет. Триггер не отключается.');
      return stats;
    }
    if (threads.length > 0) jmailProps_().deleteProperty("no_jobs_since");
    if (threads.length === 0) {
      stats.status = "time_budget_reached";
      return stats;
    }

    const currentDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy");
    let analyzedJobs = [];

  // Шаг 1: Анализ всех писем батча через Gemini
  for (let i = 0; i < threads.length; i++) {
      if (!shouldContinueProcessing(startTime, 60, stats, "анализ писем")) break;

    const thread = threads[i];
    const messages = thread.getMessages();
    const lastMessage = messages[messages.length - 1];
    
    const emailSubject = lastMessage.getSubject();
    const emailBody = lastMessage.getPlainBody();
    const emailHtml = lastMessage.getBody();

    try {
      Utilities.sleep(1000);
      const aiResponse = analyzeJobWithGemini(emailBody, currentDate, recentApplications, emailHtml);
        if (!aiResponse) continue;
        stats.analyzed++;
      if (aiResponse.is_job_related === false) {
        thread.addLabel(processedLabel);
        thread.moveToTrash();
        stats.nonJobs = (stats.nonJobs || 0) + 1;
        continue;
      }

      const eligibility = evaluateJobEligibility(aiResponse, emailBody, emailHtml, startTime, stats);
      if (eligibility.status === "defer") continue;
      if (eligibility.status === "reject") {
        thread.addLabel(processedLabel);
        thread.moveToTrash();
        stats.rejected++;
        continue;
      }
      if (eligibility.status === "review") {
        thread.addLabel(reviewLabel);
        stats.review++;
        Logger.log("Письмо автоматически отложено для проверки: " + eligibility.reason);
        continue;
      }

      aiResponse.thread = thread;
      aiResponse.emailSubject = emailSubject;
      aiResponse.tracker_data.date = currentDate;
      aiResponse.job_description = emailBody;
      analyzedJobs.push(aiResponse);

    } catch (e) {
        stats.errors++;
        Logger.log("Ошибка анализа письма: " + e.toString());
    }
  }

    if (analyzedJobs.length === 0) {
      if (stats.status === "running") {
        stats.status = stats.stoppedForTime
          ? "time_budget_reached"
          : (stats.rejected > 0 || stats.review > 0 ? "no_eligible_jobs" : "no_valid_analysis");
      }
      return stats;
    }

    if (!shouldContinueProcessing(startTime, CONFIG.MIN_SECONDS_TO_START_JOB, stats, "отбор вакансий")) {
      stats.status = "time_budget_reached";
      return;
    }

  // Шаг 2: без фиксированной квоты. Каждый кандидат уже прошел порог и жесткие проверки.
  const jobsToProcess = analyzedJobs;
  stats.selected = jobsToProcess.length;

  // Шаг 3: Обработка отобранных вакансий
    for (let j = 0; j < jobsToProcess.length; j++) {
      if (!shouldContinueProcessing(startTime, CONFIG.MIN_SECONDS_TO_START_JOB, stats, "обработка вакансий")) break;
    const aiResponse = jobsToProcess[j];
    
    try {
      const cvContent = generateJobApplicationDocumentsWithGemini(aiResponse);
      if (!cvContent) {
        stats.errors++;
        Logger.log("Документы не созданы; письмо оставлено под входным ярлыком для следующего обычного запуска.");
        continue;
      }
      aiResponse.cv_document = cvContent;
      aiResponse.cv_summary = cvContent.cv_summary;
      aiResponse.cover_letter = cvContent.cover_letter;
      aiResponse.cvPdfFileId = generateUniqueCvPDF(aiResponse);
      generateAnschreibenPDF(aiResponse);

      writeToActiveMonthlySheet(aiResponse);

      if (aiResponse.contact_email) {
        createGmailDraftWithUniqueCV(aiResponse, aiResponse.emailSubject);
      }

      if (aiResponse.is_newsletter === true) {
        createDirectNotificationInFertig(aiResponse, processedLabel, aiResponse.job_url);
        aiResponse.thread.moveToTrash();
      } else {
        aiResponse.thread.addLabel(processedLabel);
        aiResponse.thread.moveToArchive(); // Убирает письмо из Входящих.
      }
      stats.completed++;
    } catch (procErr) {
        stats.errors++;
        Logger.log("Ошибка обработки вакансии: " + procErr.toString());
    }
    }
    if (stats.status === "running") {
      stats.status = stats.stoppedForTime ? "time_budget_reached" : (stats.errors > 0 ? "completed_with_errors" : "completed");
    }
  } catch (err) {
    stats.status = "error";
    stats.errors++;
    Logger.log("Критическая ошибка запуска: " + err.toString());
    throw err;
  } finally {
    const elapsed = (Date.now() - startTime) / 1000;
    stats.runtimeSeconds = Math.round(elapsed * 10) / 10;
    Logger.log("Итог запуска: " + JSON.stringify(stats));
    try {
      const props = jmailProps_();
      props.setProperty("last_runtime_seconds", String(stats.runtimeSeconds));
      props.setProperty("last_run_timestamp", new Date().toISOString());
      props.setProperty("last_run_status", stats.status);
      props.setProperty("last_run_stats", JSON.stringify(stats));
    } catch (metricsError) {
      Logger.log("Не удалось сохранить метрики запуска: " + metricsError.toString());
    }
  }
  return stats;
}

function shouldContinueProcessing(startTime, reserveSeconds, stats, phase) {
  const elapsed = (Date.now() - startTime) / 1000;
  const budget = Number(CONFIG.MAX_RUNTIME_SECONDS) || 300;
  if (elapsed + (reserveSeconds || 0) >= budget) {
    if (!stats.stoppedForTime) {
      Logger.log("Остановка до лимита времени на этапе «" + phase + ": прошло " + elapsed.toFixed(1) + " с, бюджет " + budget + " с.");
    }
    stats.stoppedForTime = true;
    return false;
  }
  return true;
}

function evaluateJobEligibility(aiResponse, emailBody, emailHtml, startTime, stats) {
  if (aiResponse.verdict === "SKIP" || aiResponse.match_score < CONFIG.MIN_MATCH_SCORE) {
    return { status: "reject", reason: "ниже проходного балла или вердикт SKIP" };
  }

  const sourceText = String(emailBody || "") + " " + stripHtmlForEvidence(emailHtml || "");
  const evidence = aiResponse.evidence || {};
  const role = aiResponse.role_family;
  const physical = aiResponse.physical_demand;
  const effort = aiResponse.application_effort;

  if ((CONFIG.EXCLUDED_ROLE_FAMILIES || ["data_analyst"]).includes(role)) {
    return evidenceIsPresent(sourceText, evidence.role)
      ? { status: "reject", reason: "роль Data Analyst исключена" }
      : { status: "review", reason: "тип роли не подтвержден текстом письма" };
  }
  if ((CONFIG.EXCLUDED_PHYSICAL_DEMANDS || ["heavy", "prolonged_standing"]).includes(physical)) {
    return evidenceIsPresent(sourceText, evidence.physical)
      ? { status: "reject", reason: "тяжелая физическая работа или длительная работа стоя" }
      : { status: "review", reason: "физические требования не подтверждены текстом письма" };
  }
  if (effort === "complex") {
    return evidenceIsPresent(sourceText, evidence.application)
      ? { status: "reject", reason: "сложный процесс подачи заявки" }
      : { status: "review", reason: "сложность отклика не подтверждена текстом письма" };
  }

  if (!(CONFIG.ALLOWED_ROLE_FAMILIES || ["office_admin", "quality_control", "customer_service", "supervisor", "other"]).includes(role) ||
      !(CONFIG.ALLOWED_PHYSICAL_DEMANDS || ["desk", "light"]).includes(physical) ||
      !(CONFIG.ALLOWED_APPLICATION_EFFORTS || ["simple", "moderate"]).includes(effort)) {
    return { status: "review", reason: "не удалось уверенно определить профиль, нагрузку или сложность отклика" };
  }

  if (!evidenceIsPresent(sourceText, evidence.role) ||
      !evidenceIsPresent(sourceText, evidence.physical) ||
      !evidenceIsPresent(sourceText, evidence.application)) {
    return { status: "review", reason: "не удалось сверить объяснение модели с исходным письмом" };
  }

  if (aiResponse.work_mode === "remote") {
    return evidenceIsPresent(sourceText, evidence.location)
      ? { status: "pass", reason: "удаленная работа подтверждена" }
      : { status: "review", reason: "удаленный формат не подтвержден текстом письма" };
  }

  if (!["on_site", "hybrid"].includes(aiResponse.work_mode) ||
      !aiResponse.job_location ||
      !evidenceIsPresent(sourceText, evidence.location) ||
      !locationMatchesEvidence(aiResponse.job_location, evidence.location)) {
    return { status: "review", reason: "не удалось подтвердить адрес или формат работы по тексту письма" };
  }

  if (!shouldContinueProcessing(startTime, 90, stats, "проверка маршрута")) {
    return { status: "defer", reason: "не осталось безопасного времени на расчет маршрута" };
  }
  const commute = getCommuteMinutes(aiResponse.job_location);
  if (!commute.available) {
    return { status: "review", reason: "не удалось рассчитать маршрут до указанной локации" };
  }
  if (commute.minutes > CONFIG.MAX_COMMUTE_MINUTES) {
    return { status: "reject", reason: "дорога превышает установленный лимит" };
  }
  aiResponse.commute_minutes = commute.minutes;
  aiResponse.commute_mode = commute.mode;
  return { status: "pass", reason: "дорога в пределах установленного лимита" };
}

function getCommuteMinutes(destination) {
  const origin = CONFIG.SENDER_INFO.address;
  if (!origin || !destination) return { available: false };

  let transitMinutes = null;
  let bicycleMinutes = null;
  try {
    const departure = getNextWeekdayMorning();
    const transit = Maps.newDirectionFinder()
      .setOrigin(origin)
      .setDestination(String(destination) + ", Deutschland")
      .setMode(Maps.DirectionFinder.Mode.TRANSIT)
      .setDepart(departure)
      .setLanguage("de")
      .setRegion("de")
      .getDirections();
    transitMinutes = getFirstRouteMinutes(transit);
  } catch (err) {
    Logger.log("Не удалось рассчитать маршрут на общественном транспорте.");
  }

  try {
    const bicycle = Maps.newDirectionFinder()
      .setOrigin(origin)
      .setDestination(String(destination) + ", Deutschland")
      .setMode(Maps.DirectionFinder.Mode.BICYCLING)
      .setLanguage("de")
      .setRegion("de")
      .getDirections();
    bicycleMinutes = getFirstRouteMinutes(bicycle);
  } catch (err) {
    Logger.log("Не удалось рассчитать маршрут на велосипеде.");
  }

  const options = [];
  if (transitMinutes !== null) options.push({ minutes: transitMinutes, mode: "public_transport" });
  if (bicycleMinutes !== null) options.push({ minutes: bicycleMinutes, mode: "bicycle" });
  if (options.length === 0) return { available: false };
  options.sort((a, b) => a.minutes - b.minutes);
  return { available: true, minutes: options[0].minutes, mode: options[0].mode };
}

function getFirstRouteMinutes(directions) {
  if (!directions || directions.status !== "OK" || !directions.routes || !directions.routes.length) return null;
  const legs = directions.routes[0].legs || [];
  if (!legs.length || !legs[0].duration || typeof legs[0].duration.value !== "number") return null;
  return Math.ceil(legs[0].duration.value / 60);
}

function getNextWeekdayMorning() {
  const departure = new Date();
  departure.setHours(8, 0, 0, 0);
  if (departure.getTime() <= Date.now()) departure.setDate(departure.getDate() + 1);
  while (departure.getDay() === 0 || departure.getDay() === 6) {
    departure.setDate(departure.getDate() + 1);
  }
  return departure;
}

function normalizeEvidence(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceIsPresent(sourceText, quote) {
  const normalizedQuote = normalizeEvidence(quote);
  return normalizedQuote.length >= 6 && normalizeEvidence(sourceText).indexOf(normalizedQuote) !== -1;
}

function locationMatchesEvidence(location, quote) {
  const normalizedLocation = normalizeEvidence(location);
  const normalizedQuote = normalizeEvidence(quote);
  return normalizedLocation.length >= 3 && normalizedQuote.indexOf(normalizedLocation) !== -1;
}

function stripHtmlForEvidence(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

// Запустите вручную один раз после загрузки, если Google запросит разрешение для Google Maps.
// Функция использует только общедоступные примерные точки и не трогает почту или таблицу.
function authorizeMapsService() {
  const directions = Maps.newDirectionFinder()
    .setOrigin((CONFIG.SENDER_INFO.city || "") + ", Deutschland")
    .setDestination("Offenbach am Main, Deutschland")
    .setMode(Maps.DirectionFinder.Mode.DRIVING)
    .getDirections();
  Logger.log("Maps Service authorization check: " + (directions.status || "no status"));
}



