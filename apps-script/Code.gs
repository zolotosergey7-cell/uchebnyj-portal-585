/**
 * Учебный портал 585 GOLD — приём результатов в Google Таблицу.
 * Лист «Сотрудники» — сводка: одна строка на сотрудника, по колонке на курс.
 * Лист «Попытки»    — журнал: одна строка на попытку прохождения курса (с ответами на тест).
 *
 * Установка: Расширения → Apps Script → вставить этот код → запустить setup() один раз →
 * Развернуть → Новое развёртывание → Веб-приложение (Выполнять от: меня; Доступ: все) → скопировать URL …/exec.
 */

// Порядок и названия должны совпадать с config.js на портале
var COURSES = [
  ['metals', 'Металлы'], ['stones', 'Камни'],
  ['greeting', 'Приветствие и установление контакта'], ['needs', 'Выявление потребностей'], ['presentation', 'Презентация'],
  ['objections', 'Работа с возражениями'], ['closing', 'Завершение сделки'],
  ['safe-shop', 'Безопасный магазин 2.0'], ['credit', 'Кредит'], ['bonus', 'Гид по бонусам']
];
var USERS = 'Сотрудники', LOG = 'Попытки';
var U_HEAD = ['Ключ', 'ФИО', 'Адрес объекта', 'Должность', 'Регистрация', 'Последняя активность', 'Сдано курсов', 'Траектория пройдена'];
var L_HEAD = ['Попытка', 'Ключ', 'ФИО', 'Адрес объекта', 'Должность', 'Курс', 'Начало', 'Обновлено', 'Статус', 'Балл, %', 'Время в курсе, мин', 'Статус SCORM', 'Ответы на тест'];
var U_FIRST_COURSE_COL = U_HEAD.length + 1;

function setup() {
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone('Europe/Moscow');
  var u = sheet_(USERS, U_HEAD.concat(COURSES.map(function (c) { return c[1]; })));
  var l = sheet_(LOG, L_HEAD);
  u.hideColumns(1); l.hideColumns(1, 2);
  u.setFrozenColumns(2);
  u.getRange(2, 5, u.getMaxRows() - 1, 2).setNumberFormat('dd.mm.yyyy HH:mm');
  l.getRange(2, 7, l.getMaxRows() - 1, 2).setNumberFormat('dd.mm.yyyy HH:mm');
  u.setColumnWidth(2, 240); u.setColumnWidth(3, 240); u.setColumnWidth(4, 170);
  u.setColumnWidths(U_FIRST_COURSE_COL, COURSES.length, 150);
  l.setColumnWidth(3, 220); l.setColumnWidth(6, 230); l.setColumnWidth(13, 420);
  // цвета статусов
  var rng = u.getRange(2, U_FIRST_COURSE_COL, u.getMaxRows() - 1, COURSES.length);
  var rngL = l.getRange(2, 9, l.getMaxRows() - 1, 1);
  var rules = [];
  [rng, rngL].forEach(function (r) {
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Сдан').setBackground('#D9F2D9').setFontColor('#1B5E20').setRanges([r]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Не сдан').setBackground('#FFEAEA').setFontColor('#C62828').setRanges([r]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('В процессе').setBackground('#FFF7C2').setRanges([r]).build());
  });
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Да').setBackground('#F42C24').setFontColor('#FFFFFF').setBold(true)
    .setRanges([u.getRange(2, 8, u.getMaxRows() - 1, 1)]).build());
  u.setConditionalFormatRules(rules.slice(0, 3).concat(rules[6]));
  l.setConditionalFormatRules(rules.slice(3, 6));
  [u, l].forEach(function (s) { if (!s.getFilter()) s.getRange(1, 1, Math.max(2, s.getLastRow()), s.getLastColumn()).createFilter(); });
}

function sheet_(name, head) {
  var ss = SpreadsheetApp.getActive(), s = ss.getSheetByName(name) || ss.insertSheet(name);
  if (s.getLastRow() === 0) {
    s.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#F42C24').setFontColor('#FFFFFF').setWrap(true);
    s.setFrozenRows(1);
  }
  return s;
}

/* ---------- HTTP ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {}, out;
  try { out = p.action === 'progress' ? { ok: true, progress: progress_(String(p.uid || '')) } : { ok: true, service: 'portal-585' }; }
  catch (err) { out = { ok: false, error: String(err) }; }
  var json = JSON.stringify(out), cb = String(p.callback || '');
  if (/^[A-Za-z_$][\w$]{0,40}$/.test(cb)) return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (!d || !d.user || !d.user.uid) throw new Error('no user');
    var u = cleanUser_(d.user);
    var row = upsertUser_(u);
    if (d.type === 'attempt' && d.course && courseIndex_(d.course.id) >= 0) {
      upsertAttempt_(u, d);
      updateSummary_(row, d);
    }
    return ContentService.createTextOutput('{"ok":true}').setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally { lock.releaseLock(); }
}

/* ---------- логика ---------- */
function cleanUser_(u) {
  function c(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim().slice(0, n); return /^[=+\-@]/.test(s) ? "'" + s : s; }
  return { uid: String(u.uid).slice(0, 300), fio: c(u.fio, 150), address: c(u.address, 250), position: c(u.position, 120) };
}
function courseIndex_(id) { for (var i = 0; i < COURSES.length; i++) if (COURSES[i][0] === id) return i; return -1; }
function findRow_(s, col, val) {
  var n = s.getLastRow(); if (n < 2) return -1;
  var f = s.getRange(2, col, n - 1, 1).createTextFinder(val).matchEntireCell(true).findNext();
  return f ? f.getRow() : -1;
}
function label_(status, score) {
  var sc = score === null || score === undefined || score === '' ? '' : ' · ' + Math.round(Number(score)) + '%';
  return status === 'passed' ? 'Сдан' + sc : status === 'failed' ? 'Не сдан' + sc : 'В процессе';
}
function parse_(label) {
  label = String(label || ''); if (!label) return null;
  var m = label.match(/(\d+)%/), score = m ? Number(m[1]) : null;
  if (label.indexOf('Сдан') === 0) return { status: 'passed', score: score };
  if (label.indexOf('Не сдан') === 0) return { status: 'failed', score: score };
  return { status: 'started', score: null };
}

function upsertUser_(u) {
  var s = sheet_(USERS, U_HEAD.concat(COURSES.map(function (c) { return c[1]; })));
  var r = findRow_(s, 1, u.uid), now = new Date();
  if (r < 0) {
    var row = [u.uid, u.fio, u.address, u.position, now, now, 0, 'Нет'];
    COURSES.forEach(function () { row.push(''); });
    s.appendRow(row); return s.getLastRow();
  }
  s.getRange(r, 2, 1, 3).setValues([[u.fio, u.address, u.position]]);
  s.getRange(r, 6).setValue(now);
  return r;
}

function upsertAttempt_(u, d) {
  var s = sheet_(LOG, L_HEAD), id = String(d.attempt || '').slice(0, 60); if (!id) return;
  var r = findRow_(s, 1, id);
  var started = d.startedAt ? new Date(d.startedAt) : new Date();
  var answers = String(d.answers || '').slice(0, 45000);
  var vals = [id, u.uid, u.fio, u.address, u.position, COURSES[courseIndex_(d.course.id)][1], started, new Date(),
    label_(d.status, d.score), d.score === null || d.score === undefined ? '' : Number(d.score),
    Math.round((Number(d.timeSec) || 0) / 6) / 10, String(d.scormStatus || ''), answers];
  if (r < 0) { s.appendRow(vals); return; }
  var old = s.getRange(r, 1, 1, vals.length).getValues()[0];
  if (!answers && old[12]) vals[12] = old[12];                  // не затираем ответы пустыми
  var o = parse_(old[8]);
  if (o && o.status !== 'started' && d.status === 'started') { vals[8] = old[8]; vals[9] = old[9]; }  // итог попытки не откатываем
  s.getRange(r, 1, 1, vals.length).setValues([vals]);
}

function updateSummary_(row, d) {
  var s = SpreadsheetApp.getActive().getSheetByName(USERS);
  var col = U_FIRST_COURSE_COL + courseIndex_(d.course.id), cell = s.getRange(row, col);
  var cur = parse_(cell.getValue()), next = { status: d.status, score: d.score === null || d.score === undefined ? null : Number(d.score) };
  var keep = false;
  if (cur && cur.status === 'passed') keep = !(next.status === 'passed' && (next.score || 0) > (cur.score || 0));
  else if (cur && cur.status === 'failed' && next.status === 'started') keep = true;
  if (!keep) cell.setValue(label_(next.status, next.score));
  var labels = s.getRange(row, U_FIRST_COURSE_COL, 1, COURSES.length).getValues()[0];
  var done = labels.filter(function (x) { return String(x).indexOf('Сдан') === 0; }).length;
  s.getRange(row, 7, 1, 2).setValues([[done, done === COURSES.length ? 'Да' : 'Нет']]);
}

function progress_(uid) {
  var s = SpreadsheetApp.getActive().getSheetByName(USERS), out = {};
  if (!s || !uid) return out;
  var r = findRow_(s, 1, uid); if (r < 0) return out;
  var labels = s.getRange(r, U_FIRST_COURSE_COL, 1, COURSES.length).getValues()[0];
  var at = s.getRange(r, 6).getValue();
  COURSES.forEach(function (c, i) { var p = parse_(labels[i]); if (p) { p.at = at instanceof Date ? at.toISOString() : ''; out[c[0]] = p; } });
  return out;
}
