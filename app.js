const HOLIDAYS = window.JP_HOLIDAYS_2026;
const GW = window.GW_2026;
const MEMBERS = window.TEAM_MEMBERS;
const COLORS = window.MEMBER_COLORS;
const MONTHS = window.MONTHS_TO_SHOW;

const STORAGE_KEY = "japan-ia-vacations-v1";
const REPO_JSON_URL = "vacations.json";

const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];

let state = {
  vacations: [],
  activeFilter: "ALL"
};

/* ───── helpers ───── */
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
  return Math.round((parseYmd(to) - parseYmd(from)) / 86400000) + 1;
}
function shortRange(from, to) {
  const f = parseYmd(from), t = parseYmd(to);
  const fmt = (d) => `${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`;
  return from === to ? fmt(f) : `${fmt(f)} – ${fmt(t)}`;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* ───── load / save ───── */
async function loadVacations() {
  let repoData = [];
  try {
    const res = await fetch(REPO_JSON_URL, { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      if (Array.isArray(j.vacations)) repoData = j.vacations;
    }
  } catch (e) {}

  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed.vacations)) {
        state.vacations = parsed.vacations;
        return;
      }
    } catch (e) {}
  }
  state.vacations = repoData;
}
function saveLocal() {
  localStorage.setItem(STORAGE_KEY,
    JSON.stringify({ vacations: state.vacations }, null, 2));
}

/* ───── render: calendars ───── */
function renderCalendars() {
  const root = document.getElementById("calendars");
  root.innerHTML = "";
  MONTHS.forEach(({ year, month }) => {
    root.appendChild(renderMonth(year, month));
  });
}

function renderMonth(year, monthIdx) {
  const isGwMonth = (year === 2026 && (monthIdx === 3 || monthIdx === 4));

  const card = document.createElement("div");
  card.className = "month";

  const header = document.createElement("div");
  header.className = "month-header" + (isGwMonth ? " gw-month" : "");
  header.innerHTML = `
    <div class="name">${MONTH_NAMES[monthIdx]}</div>
    <div class="year">${year}</div>
  `;
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
    if (inRange(dateStr, GW.start, GW.end) && !HOLIDAYS[dateStr]) {
      const b = document.createElement("div");
      b.className = "gw-badge";
      b.textContent = "GW";
      cell.appendChild(b);
    }

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

/* ───── tabs ───── */
function renderTabs() {
  const tabs = document.getElementById("memberTabs");
  tabs.innerHTML = "";
  ["ALL", ...MEMBERS].forEach(m => {
    const b = document.createElement("button");
    b.textContent = m === "ALL" ? "All" : m;
    if (state.activeFilter === m) b.classList.add("active");
    b.addEventListener("click", () => {
      state.activeFilter = m;
      renderAll();
    });
    tabs.appendChild(b);
  });
}

/* ───── editor list + json ───── */
function renderEditor() {
  const sel = document.getElementById("editMember");
  if (!sel.options.length) {
    sel.innerHTML = MEMBERS.map(m => `<option>${m}</option>`).join("");
  }
  if (!document.getElementById("editFrom").value) {
    document.getElementById("editFrom").value = "2026-04-30";
    document.getElementById("editTo").value = "2026-05-01";
  }

  const list = document.getElementById("vacationList");
  list.innerHTML = "";
  if (state.vacations.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "No time off recorded yet.";
    list.appendChild(li);
  }
  state.vacations
    .slice()
    .sort((a, b) => a.from.localeCompare(b.from))
    .forEach((v) => {
      const li = document.createElement("li");
      const days = daysBetween(v.from, v.to);
      li.innerHTML = `
        <span class="who" style="color:${COLORS[v.member]||'#fff'}">${v.member}</span>
        <span class="range">${v.from} → ${v.to} · ${days}d</span>
        ${v.note ? `<span class="note">${escapeHtml(v.note)}</span>` : ""}
      `;
      const del = document.createElement("button");
      del.className = "btn del";
      del.textContent = "Remove";
      del.addEventListener("click", () => {
        state.vacations.splice(state.vacations.indexOf(v), 1);
        saveLocal();
        renderAll();
      });
      li.appendChild(del);
      list.appendChild(li);
    });

  document.getElementById("jsonPreview").textContent =
    JSON.stringify({ vacations: state.vacations }, null, 2);
}

/* ───── team summary ───── */
function renderTeamSummary() {
  const root = document.getElementById("teamSummary");
  root.innerHTML = "";
  MEMBERS.forEach(m => {
    const card = document.createElement("div");
    card.className = "team-card";
    card.style.setProperty("--member-color", COLORS[m]);
    const myVacs = state.vacations.filter(v => v.member === m);
    const inGw = myVacs.filter(v => v.from <= GW.end && v.to >= GW.start);
    const totalGwDays = inGw.reduce((sum, v) => {
      const from = v.from < GW.start ? GW.start : v.from;
      const to   = v.to   > GW.end   ? GW.end   : v.to;
      return sum + daysBetween(from, to);
    }, 0);
    const ranges = myVacs.map(v => shortRange(v.from, v.to)).join(" · ") ||
                   "<em>nothing booked</em>";
    card.innerHTML = `
      <div class="name">${m}</div>
      <div class="gw-days">${totalGwDays}<small>${totalGwDays===1?'day':'days'} in GW</small></div>
      <div class="ranges">${ranges}</div>
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

/* ───── events ───── */
function wire() {
  document.getElementById("editForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const m = document.getElementById("editMember").value;
    const f = document.getElementById("editFrom").value;
    const t = document.getElementById("editTo").value;
    const n = document.getElementById("editNote").value.trim();
    if (!m || !f || !t) { alert("Member, From and To are required."); return; }
    if (f > t) { alert("'From' must be on or before 'To'."); return; }
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
    a.href = url; a.download = "vacations.json"; a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("copyBtn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(
      JSON.stringify({ vacations: state.vacations }, null, 2)
    );
    const btn = document.getElementById("copyBtn");
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => btn.textContent = orig, 1500);
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

(async function init() {
  await loadVacations();
  wire();
  renderAll();
})();
