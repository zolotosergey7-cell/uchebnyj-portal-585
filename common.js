/* Общая логика портала: пользователь, прогресс, траектория, связь с таблицей */
(function () {
  var P = window.PORTAL, NS = "p585:";

  function lsGet(k, d) { try { var v = localStorage.getItem(NS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(NS + k); } catch (e) {} }

  function norm(s) { return String(s || "").toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/g, ""); }
  function makeUid(u) { return norm(u.fio) + "|" + norm(u.address); }

  function getUser() { return lsGet("user", null); }
  function setUser(u) { u.uid = makeUid(u); lsSet("user", u); return u; }
  function logout() { lsDel("user"); }

  /* Прогресс: { courseId: { status:'passed'|'failed'|'started', score:Number|null, at:ISO } } */
  function getProgress(uid) { return lsGet("prog:" + uid, {}); }
  function rank(s) { return s === "passed" ? 3 : s === "failed" ? 2 : s === "started" ? 1 : 0; }
  function mergeEntry(prog, cid, e) {
    var cur = prog[cid];
    if (!cur) { prog[cid] = e; return; }
    if (cur.status === "passed" && e.status !== "passed") return;          // сданный курс не «отзывается»
    if (e.status === "passed" && cur.status === "passed") {                // оставляем лучший балл
      if ((e.score || 0) > (cur.score || 0)) prog[cid] = e; return;
    }
    if (rank(e.status) >= rank(cur.status) || (e.at || "") > (cur.at || "")) prog[cid] = e;
  }
  function saveEntry(uid, cid, e) { var p = getProgress(uid); mergeEntry(p, cid, e); lsSet("prog:" + uid, p); return p; }

  /* Траектории */
  function getTrack(id) { for (var i = 0; i < P.tracks.length; i++) if (P.tracks[i].id === id) return P.tracks[i]; return P.tracks[0]; }
  function trackCourses(t) { var a = []; t.stages.forEach(function (s) { a = a.concat(s.courses); }); return a; }
  function courseState(prog, track) {
    var t = typeof track === "string" ? getTrack(track) : (track || P.tracks[0]);
    var res = {}, prevStageDone = true;
    t.stages.forEach(function (st, si) {
      var prevInStage = true;
      st.courses.forEach(function (cid, ci) {
        var e = prog[cid], passed = e && e.status === "passed";
        var open = prevStageDone && (!st.sequential || prevInStage);
        res[cid] = { stage: si, index: ci, open: open, passed: !!passed, entry: e || null };
        prevInStage = !!passed;
      });
      prevStageDone = prevStageDone && st.courses.every(function (c) { return prog[c] && prog[c].status === "passed"; });
    });
    return res;
  }
  function nextCourse(state, track) {
    var cs = trackCourses(typeof track === "string" ? getTrack(track) : (track || P.tracks[0]));
    for (var i = 0; i < cs.length; i++) { var c = state[cs[i]]; if (c.open && !c.passed) return cs[i]; }
    return null;
  }
  /* курс открыт хотя бы в одной траектории */
  function isOpenAnywhere(prog, cid) {
    return P.tracks.some(function (t) { var s = courseState(prog, t); return s[cid] && s[cid].open; });
  }
  function trackOfCourse(cid, preferred) {
    var p = getTrack(preferred);
    if (trackCourses(p).indexOf(cid) >= 0) return p.id;
    for (var i = 0; i < P.tracks.length; i++) if (trackCourses(P.tracks[i]).indexOf(cid) >= 0) return P.tracks[i].id;
    return P.tracks[0].id;
  }

  /* Связь с Google Apps Script */
  function apiPost(payload, beacon) {
    if (!P.api) return;
    var body = JSON.stringify(payload);
    try {
      if (beacon && navigator.sendBeacon) { navigator.sendBeacon(P.api, new Blob([body], { type: "text/plain;charset=utf-8" })); return; }
      fetch(P.api, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body, keepalive: body.length < 60000 });
    } catch (e) {}
  }
  function apiProgress(uid, cb) {
    if (!P.api) { cb(null); return; }
    var name = "p585cb" + Date.now(), done = false, s = document.createElement("script");
    var t = setTimeout(function () { finish(null); }, 9000);
    function finish(d) { if (done) return; done = true; clearTimeout(t); try { delete window[name]; } catch (e) { window[name] = undefined; } s.remove(); cb(d); }
    window[name] = function (d) { finish(d); };
    s.onerror = function () { finish(null); };
    s.src = P.api + (P.api.indexOf("?") < 0 ? "?" : "&") + "action=progress&uid=" + encodeURIComponent(uid) + "&callback=" + name;
    document.head.appendChild(s);
  }
  function syncProgress(uid, cb) {
    apiProgress(uid, function (d) {
      var p = getProgress(uid);
      if (d && d.ok && d.progress) { Object.keys(d.progress).forEach(function (c) { mergeEntry(p, c, d.progress[c]); }); lsSet("prog:" + uid, p); }
      cb(p, !!(d && d.ok));
    });
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function firstName(fio) { var p = String(fio || "").trim().split(/\s+/); return p.length > 1 ? p[1] : (p[0] || "коллега"); }

  window.Portal = { lsGet: lsGet, lsSet: lsSet, lsDel: lsDel, getUser: getUser, setUser: setUser, logout: logout,
    getProgress: getProgress, saveEntry: saveEntry, courseState: courseState, nextCourse: nextCourse,
    getTrack: getTrack, trackCourses: trackCourses, isOpenAnywhere: isOpenAnywhere, trackOfCourse: trackOfCourse,
    apiPost: apiPost, syncProgress: syncProgress, esc: esc, firstName: firstName };
})();
