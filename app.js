// Load holidays/team config
const HOLIDAYS = window.JP_HOLIDAYS_2026;
const GW = window.GW_2026;
const MEMBERS = window.TEAM_MEMBERS;
const COLORS = window.MEMBER_COLORS;

const STORAGE_KEY = "japan-ia-vacations-v1";
const REPO_JSON_URL = "vacations.json"; // served alongside index.html

let state = {
  vacations: [], // { member, from, to, note }
  activeFilter: "ALL"
};

// --- Date helpers (local-time, no UTC drift) ---
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseYmd(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function inRange(dateStr, from, to) {
  return dateStr >= from && dateStr <= to;
}
function daysBetween(from, to) {
  const a = parseYmd(from), b = parseYmd(to);
  return Math.round((b - a) / 86400000) + 1;
}

// --- Load / Save ---
async function loadVacations() {
  // 1. Try repo JSON
  let repoData = [];
  try {
    const res = await fetch(REPO_JSON_URL, { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      if (Array.isArray(j.vacations)) repoData = j.vacations;
    }
  } catch (e) { /* ignore */ }

  // 2. Local edits override
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed.vacations)) {
        state.vacations = parsed.vacations;
        return;
      }
    } catch (e) { /* ignore */ }
  }
  state.vacations = repoData;
}
function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ vacations: state.vacations }, null, 2));
}

// --- Render calendars (Jan-Dec 2026, but emphasize Apr-May) ---
function renderCalendars() {
  const root = document.getElementById("calendars");
  root.innerHTML = "";
  // Show Apr & May prominently first, then surrounding months
  const monthsOrder = [3, 4, 5, 6, 0, 1, 2, 7, 8, 9, 10, 11]; // Apr, May, Jun, Jul, then rest
  for (const m of monthsOrder) {
    root.appendChild(renderMonth(2026, m));
  }
}

function renderMonth(year, monthIdx) {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthJp   = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const isGwMonth = (monthIdx === 3 || monthIdx === 4); // April or May

  const card = document.createElement("div");
  card.className = "month";

  const header = document.createElement("div");
  header.className = "month-header" + (isGwMonth ? " gw-month" : "");
  header.textContent = `${monthNames[monthIdx]} ${year} · ${monthJp[monthIdx]}`;
  card.appendChild(header);

  const dow = document.createElement("div");
  dow.className = "dow-row";
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach((d, i) => {
    const el = document.createElement("div");
    el.textContent = d;
    if (i === 0) el.classList.add("sun");
    if (i === 6) el.classList.add("sat");
    dow.appendChild(el);
  });
  card.appendChild(dow);

  const firstDay = new Date(year, monthIdx, 1);
  const lastDay = new Date(year, monthIdx + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  let week = document.createElement("div");
  week.className = "week-row";

  // leading empties
  for (let i = 0; i < startWeekday; i++) {
    const e = document.createElement("div");
    e.className = "day empty";
    week.appendChild(e);
  }

  const todayStr = ymd(new Date());

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, monthIdx, day);
    const dateStr = ymd(date);
    const dow = date.getDay();
    const cell = document.createElement("div");
    cell.className = "day";
    if (dow === 0) cell.classList.add("sun", "weekend");
    if (dow === 6) cell.classList.add("sat", "weekend");
    if (HOLIDAYS[dateStr]) cell.classList.add("holiday");
    if (inRange(dateStr, GW.start, GW.end)) cell.classList.add("gw");
    if (dateStr === todayStr) cell.classList.add("today");

    const num = document.createElement("div");
    num.className = "day-num";
    num.textContent = day;
    cell.appendChild(num);

    if (HOLIDAYS[dateStr]) {
      const h = document.createElement("div");
      h.className = "holiday-name";
      h.textContent = HOLIDAYS[dateStr];
      cell.appendChild(h);
    }
    if (inRange(dateStr, GW.start, GW.end)) {
      const b = document.createElement("div");
      b.className = "gw-badge";
      b.textContent = "GW";
      cell.appendChild(b);
    }

    // vacation dots
    const dots = document.createElement("div");
    dots.className = "vac-dots";
    state.vacations.forEach(v => {
      if (inRange(dateStr, v.from, v.to)) {
        const dim = state.activeFilter !== "ALL" && state.activeFilter !== v.member;
        const dot = document.createElement("span");
        dot.className = "vac-dot" + (dim ? " dim" : "");
        dot.style.background = COLORS[v.member] || "#10b981";
        dot.textContent = v.member.slice(0, 2);
        dot.title = `${v.member}: ${v.from} → ${v.to}${v.note ? " ("+v.note+")" : ""}`;
        dots.appendChild(dot);
      }
    });
    cell.appendChild(dots);

    week.appendChild(cell);
    if ((startWeekday + day) % 7 === 0) {
      card.appendChild(week);
      week = document.createElement("div");
      week.className = "week-row";
    }
  }
  // trailing empties
  if (week.children.length > 0) {
    while (week.children.length < 7) {
      const e = document.createElement("div");
      e.className = "day empty";
      week.appendChild(e);
    }
    card.appendChild(week);
  }

  return card;
}

// --- Member tabs ---
function renderTabs() {
  const tabs = document.getElementById("memberTabs");
  tabs.innerHTML = "";
  ["ALL", ...MEMBERS].forEach(m => {
    const b = document.createElement("button");
    b.textContent = m === "ALL" ? "All Team" : m;
    if (state.activeFilter === m) b.classList.add("active");
    b.addEventListener("click", () => {
      state.activeFilter = m;
      renderAll();
    });
    tabs.appendChild(b);
  });
}

// --- Editor ---
function renderEditor() {
  const sel = document.getElementById("editMember");
  sel.innerHTML = MEMBERS.map(m => `<option>${m}</option>`).join("");
  // sensible defaults: GW workdays Apr 30 - May 1
  if (!document.getElementById("editFrom").value) {
    document.getElementById("editFrom").value = "2026-04-30";
    document.getElementById("editTo").value = "2026-05-01";
  }

  const list = document.getElementById("vacationList");
  list.innerHTML = "";
  if (state.vacations.length === 0) {
    list.innerHTML = '<li style="color:#6b7280;justify-content:center">No vacations recorded yet — add one above ✨</li>';
  }
  state.vacations
    .slice()
    .sort((a, b) => a.from.localeCompare(b.from))
    .forEach((v, idx) => {
      const li = document.createElement("li");
      const days = daysBetween(v.from, v.to);
      li.innerHTML = `
        <span class="who" style="color:${COLORS[v.member]||'#000'}">${v.member}</span>
        <span class="range">${v.from} → ${v.to} (${days}d)${v.note ? ' · ' + escapeHtml(v.note) : ''}</span>
      `;
      const del = document.createElement("button");
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        const realIdx = state.vacations.indexOf(v);
        state.vacations.splice(realIdx, 1);
        saveLocal();
        renderAll();
      });
      li.appendChild(del);
      list.appendChild(li);
    });

  document.getElementById("jsonPreview").textContent =
    JSON.stringify({ vacations: state.vacations }, null, 2);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

// --- Team summary cards ---
function renderTeamSummary() {
  const root = document.getElementById("teamSummary");
  root.innerHTML = "";
  MEMBERS.forEach(m => {
    const card = document.createElement("div");
    card.className = "team-card";
    const myVacs = state.vacations.filter(v => v.member === m);
    const inGw = myVacs.filter(v => v.from <= GW.end && v.to >= GW.start);
    const totalGwDays = inGw.reduce((sum, v) => {
      const from = v.from < GW.start ? GW.start : v.from;
      const to   = v.to   > GW.end   ? GW.end   : v.to;
      return sum + daysBetween(from, to);
    }, 0);
    card.innerHTML = `
      <h4 style="color:${COLORS[m]}">${m}</h4>
      <div class="vac-line">GW PTO: <strong>${totalGwDays} day${totalGwDays===1?'':'s'}</strong></div>
      <div class="vac-line">Total entries: ${myVacs.length}</div>
      <div class="vac-line">${myVacs.map(v => `${v.from.slice(5)}–${v.to.slice(5)}`).join(', ') || '<em>none</em>'}</div>
    `;
    root.appendChild(card);
  });
}

function renderAll() {
  renderTabs();
  renderCalendars();
  renderEditor();
  renderTeamSummary();
}

// --- Wire events ---
function wire() {
  document.getElementById("addBtn").addEventListener("click", () => {
    const m = document.getElementById("editMember").value;
    const f = document.getElementById("editFrom").value;
    const t = document.getElementById("editTo").value;
    const n = document.getElementById("editNote").value.trim();
    if (!m || !f || !t) { alert("Member / From / To are required"); return; }
    if (f > t) { alert("'From' must be on or before 'To'"); return; }
    state.vacations.push({ member: m, from: f, to: t, note: n });
    document.getElementById("editNote").value = "";
    saveLocal();
    renderAll();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob(
      [JSON.stringify({ vacations: state.vacations }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vacations.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("copyBtn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(
      JSON.stringify({ vacations: state.vacations }, null, 2)
    );
    alert("Copied! Paste into vacations.json and commit.");
  });

  document.getElementById("reloadBtn").addEventListener("click", async () => {
    if (!confirm("Discard local edits and reload from repo?")) return;
    localStorage.removeItem(STORAGE_KEY);
    await loadVacations();
    renderAll();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Clear all local edits?")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

// --- Boot ---
(async function init() {
  await loadVacations();
  wire();
  renderAll();
})();
