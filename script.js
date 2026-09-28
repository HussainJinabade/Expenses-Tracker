// ── PERSISTENCE ──
const STORAGE_KEY = "finflow_state_v1";

function saveState() {
  try {
    const toSave = {
      userName: state.userName,
      transactions: state.transactions,
      bills: state.bills,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn("Could not save state:", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.userName = saved.userName || "User";
      state.transactions = saved.transactions || [];
      state.bills = saved.bills || [];
      return true; // data existed
    }
  } catch (e) {
    console.warn("Could not load state:", e);
  }
  return false; // no saved data — use seed
}

let state = {
  userName: "Hussain",
  transactions: [],
  bills: [],
  txFilter: "all",
  txType: "expense",
};

const CAT_COLORS = {
  Housing: "#5c3bfe",
  Shopping: "#9333ea",
  Groceries: "#3b9ffe",
  Health: "#00c48c",
  Transportation: "#f59e0b",
  "Food & Dining": "#f24e4e",
  Utilities: "#a855f7",
  Entertainment: "#ec4899",
  Education: "#06b6d4",
  Travel: "#0ea5e9",
  Fitness: "#22c55e",
  "Personal Care": "#f97316",
  Subscriptions: "#8b5cf6",
  Insurance: "#64748b",
  Income: "#00c48c",
  Other: "#94a3b8",
};
const CAT_EMOJI = {
  Housing: "🏠",
  Shopping: "🛍️",
  Groceries: "🛒",
  Health: "💊",
  Transportation: "🚗",
  "Food & Dining": "🍽️",
  Utilities: "⚡",
  Entertainment: "🎬",
  Education: "📚",
  Travel: "✈️",
  Fitness: "🏋️",
  "Personal Care": "💅",
  Subscriptions: "📺",
  Insurance: "🛡️",
  Income: "💰",
  Other: "📦",
};

function showPage(p) {
  document
    .querySelectorAll(".page")
    .forEach((x) => x.classList.remove("active"));
  document
    .querySelectorAll(".nav-link")
    .forEach((x) => x.classList.remove("active"));
  document
    .querySelectorAll(".bottom-nav-item")
    .forEach((x) => x.classList.remove("active"));
  document.getElementById("page-" + p).classList.add("active");
  const i = ["home", "transactions", "forecast"].indexOf(p);
  document.querySelectorAll(".nav-link")[i]?.classList.add("active");
  document.querySelectorAll(".bottom-nav-item")[i]?.classList.add("active");
  if (p === "forecast") setTimeout(drawChart, 60);
}

function openProfileModal() {
  document.getElementById("profileName").value = state.userName;
  document.getElementById("profileModal").classList.add("open");
}
function closeProfileModal() {
  document.getElementById("profileModal").classList.remove("open");
}
function saveProfile() {
  const n = document.getElementById("profileName").value.trim();
  if (!n) return toast("Please enter a name");
  state.userName = n;
  document.getElementById("homeGreeting").textContent = "Hi, " + n + " 👋";
  saveState();
  closeProfileModal();
  toast("Name updated! 👋");
}

const getTotalIncome = () =>
  state.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
const getTotalExpense = () =>
  state.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
const getBalance = () => getTotalIncome() - getTotalExpense();
const fmt = (n) => "₹" + n.toLocaleString("en-IN");

function renderHome() {
  const bal = getBalance(),
    inc = getTotalIncome(),
    exp = getTotalExpense();
  setNum("balanceDisplay", bal);
  setNum("totalIncomeDisplay", inc);
  setNum("totalExpenseDisplay", exp);
  const d = new Date();
  document.getElementById("balanceDate").textContent = d.toLocaleDateString(
    "en-IN",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );
  renderBills();
}
function setNum(id, val) {
  const el = document.getElementById(id);
  const from = parseInt(el.dataset.val || "0");
  el.dataset.val = val;
  let s = 0;
  const t = setInterval(() => {
    s++;
    el.textContent = fmt(Math.round(from + (val - from) * (s / 20)));
    if (s >= 20) {
      el.textContent = fmt(val);
      clearInterval(t);
    }
  }, 16);
}

function openBillModal() {
  ["billName", "billAmount", "billDue"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("billModal").classList.add("open");
}
function closeBillModal() {
  document.getElementById("billModal").classList.remove("open");
}
function addBill() {
  const name = document.getElementById("billName").value.trim();
  const amount = parseFloat(document.getElementById("billAmount").value);
  const due = document.getElementById("billDue").value;
  const cat = document.getElementById("billCategory").value;
  if (!name || isNaN(amount) || amount <= 0 || !due)
    return toast("Please fill all fields");
  state.bills.push({ id: Date.now(), name, amount, due, cat });
  closeBillModal();
  saveState();
  renderHome();
  toast("Bill added! 🗓️");
}
function deleteBill(id) {
  state.bills = state.bills.filter((b) => b.id !== id);
  saveState();
  renderHome();
  toast("Bill removed");
}
function renderBills() {
  const el = document.getElementById("billsList");
  document.getElementById("billCount").textContent =
    state.bills.length + " bill" + (state.bills.length !== 1 ? "s" : "");
  if (!state.bills.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🗓️</div><h3>No upcoming bills</h3><p>Tap "Add Bill" to track your next payment</p></div>`;
    return;
  }
  el.innerHTML = state.bills
    .map(
      (b) => `<div class="bill-item">
    <div class="bill-left"><div class="bill-icon-wrap">${CAT_EMOJI[b.cat] || "📦"}</div>
    <div style="min-width:0"><div class="bill-name">${esc(b.name)}</div><div class="bill-due">Due: ${formatDate(b.due)}</div></div></div>
    <div class="bill-right"><div class="bill-amount">${fmt(b.amount)}</div>
    <button class="btn btn-sm btn-danger" onclick="deleteBill(${b.id})">✕</button></div></div>`,
    )
    .join("");
}

function openTxModal() {
  document.getElementById("txName").value = "";
  document.getElementById("txAmount").value = "";
  document.getElementById("txDate").value = new Date()
    .toISOString()
    .split("T")[0];
  setType("expense");
  document.getElementById("txModal").classList.add("open");
}
function closeTxModal() {
  document.getElementById("txModal").classList.remove("open");
}
function setType(type) {
  state.txType = type;
  document
    .getElementById("typeExpense")
    .classList.toggle("active", type === "expense");
  document
    .getElementById("typeIncome")
    .classList.toggle("active", type === "income");
  const s = document.getElementById("txCategory");
  if (type === "income") s.value = "Income";
  else if (s.value === "Income") s.value = "Housing";
}
function addTransaction() {
  const name = document.getElementById("txName").value.trim();
  const amount = parseFloat(document.getElementById("txAmount").value);
  const cat = document.getElementById("txCategory").value;
  const date = document.getElementById("txDate").value;
  if (!name || isNaN(amount) || amount <= 0 || !date)
    return toast("Please fill all fields");
  state.transactions.unshift({
    id: Date.now(),
    name,
    amount,
    cat,
    date,
    type: state.txType,
  });
  closeTxModal();
  saveState();
  renderAll();
  toast(state.txType === "income" ? "Income added! 💰" : "Expense recorded 📝");
}
function deleteTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  const before = state.bills.length;
  state.bills = state.bills.filter((b) => b.txId !== id);
  const removed = before - state.bills.length;
  saveState();
  renderAll();
  toast(
    removed > 0
      ? "Transaction & Bill deleted 🗑️"
      : "Transaction deleted",
  );
}
function addTxToBill(id) {
  const tx = state.transactions.find((t) => t.id === id);
  if (!tx) return;
  if (state.bills.some((b) => b.txId === id))
    return toast("Already in upcoming bills!");
  const due = new Date();
  due.setDate(due.getDate() + 7);
  state.bills.push({
    id: Date.now(),
    txId: id,
    name: tx.name,
    amount: tx.amount,
    due: due.toISOString().split("T")[0],
    cat: tx.cat,
  });
  saveState();
  renderHome();
  toast("Added to upcoming bills! 🗓️");
}
function filterTx(f, btn) {
  state.txFilter = f;
  document
    .querySelectorAll(".filter-tab")
    .forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");
  renderTransactions();
}
function renderTransactions() {
  const list =
    state.txFilter === "all"
      ? state.transactions
      : state.transactions.filter((t) => t.type === state.txFilter);
  document.getElementById("txCount").textContent =
    list.length + " transaction" + (list.length !== 1 ? "s" : "");
  const el = document.getElementById("txList");
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">💸</div><h3>No transactions</h3><p>Add a transaction to get started</p></div>`;
    return;
  }
  el.innerHTML = list
    .map(
      (tx) => `<div class="tx-item">
    <div class="tx-left">
      <div class="tx-icon" style="background:${CAT_COLORS[tx.cat] || "#9ca3b0"}22;">${CAT_EMOJI[tx.cat] || "📦"}</div>
      <div class="tx-info"><div class="tx-name">${esc(tx.name)}</div><div class="tx-cat">${tx.cat} · ${formatDate(tx.date)}</div></div>
    </div>
    <div class="tx-right">
      <div class="tx-amount ${tx.type}">${tx.type === "income" ? "+" : "-"}${fmt(tx.amount)}</div>
      <div class="tx-actions">
        ${tx.type === "expense" ? `<button class="btn btn-sm btn-orange" onclick="addTxToBill(${tx.id})" title="Add to Upcoming Bills">🗓</button>` : ""}
        <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${tx.id})">✕</button>
      </div>
    </div></div>`,
    )
    .join("");
}

// Global chart state for hover
let _chartData = {
  cumI: [],
  cumE: [],
  incD: [],
  expD: [],
  plotDays: 0,
  daysInMonth: 0,
  PAD: {},
  W: 0,
  H: 0,
  xP: null,
  yP: null,
};

function drawChart() {
  const canvas = document.getElementById("forecastChart");
  const wrap = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const W = wrap.clientWidth;
  const H = 240;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Current month range
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = now.getDate();

  // Subtitle
  document.getElementById("chartMonthLabel").textContent = now.toLocaleString(
    "default",
    { month: "long", year: "numeric" },
  );

  // Per-day income & expense
  const incD = new Array(daysInMonth).fill(0);
  const expD = new Array(daysInMonth).fill(0);
  state.transactions.forEach((t) => {
    const d = new Date(t.date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const idx = d.getDate() - 1;
      if (t.type === "income") incD[idx] += t.amount;
      else expD[idx] += t.amount;
    }
  });

  // Cumulative
  const cumI = [],
    cumE = [];
  let si = 0,
    se = 0;
  for (let i = 0; i < daysInMonth; i++) {
    si += incD[i];
    se += expD[i];
    cumI.push(si);
    cumE.push(se);
  }

  // Update balance strip with month totals
  const totalI = cumI[todayDate - 1] || 0;
  const totalE = cumE[todayDate - 1] || 0;
  document.getElementById("cbs-income").textContent = fmt(totalI);
  document.getElementById("cbs-expense").textContent = fmt(totalE);
  const bal = totalI - totalE;
  const balEl = document.getElementById("cbs-balance");
  balEl.textContent = fmt(Math.abs(bal));
  balEl.className = "cbs-val " + (bal >= 0 ? "balance" : "expense");

  const maxV = Math.max(
    ...cumI.slice(0, todayDate),
    ...cumE.slice(0, todayDate),
    500,
  );
  const PAD = { top: 20, right: 20, bottom: 38, left: W < 360 ? 44 : 56 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const plotDays = todayDate;
  const xP = (i) => PAD.left + (i / (daysInMonth - 1)) * cW;
  const yP = (v) => PAD.top + cH - (v / maxV) * cH;

  // Store for hover
  _chartData = {
    cumI,
    cumE,
    incD,
    expD,
    plotDays,
    daysInMonth,
    todayDate,
    PAD,
    W,
    H,
    xP,
    yP,
    maxV,
    year,
    month,
  };

  _redrawChart(
    ctx,
    W,
    H,
    PAD,
    cW,
    cH,
    daysInMonth,
    todayDate,
    plotDays,
    xP,
    yP,
    maxV,
    cumI,
    cumE,
    -1,
  );
}

function _redrawChart(
  ctx,
  W,
  H,
  PAD,
  cW,
  cH,
  daysInMonth,
  todayDate,
  plotDays,
  xP,
  yP,
  maxV,
  cumI,
  cumE,
  hoverIdx,
) {
  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "#e4e8f050";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = PAD.top + (g / 4) * cH;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + cW, y);
    ctx.stroke();
    ctx.fillStyle = "#9ca3b0";
    ctx.font = `${W < 360 ? 10 : 11}px Outfit`;
    ctx.textAlign = "right";
    ctx.fillText(fmtK(maxV - (g / 4) * maxV), PAD.left - 6, y + 4);
  }

  // X labels
  ctx.fillStyle = "#9ca3b0";
  ctx.textAlign = "center";
  const labelStep = W < 400 ? 7 : 5;
  for (let i = 0; i < daysInMonth; i += labelStep)
    ctx.fillText(i + 1, xP(i), H - PAD.bottom + 14);
  ctx.fillText(daysInMonth, xP(daysInMonth - 1), H - PAD.bottom + 14);

  // Future shade
  if (plotDays < daysInMonth) {
    ctx.fillStyle = "rgba(230,232,240,0.2)";
    ctx.fillRect(
      xP(plotDays - 1),
      PAD.top,
      xP(daysInMonth - 1) - xP(plotDays - 1),
      cH,
    );
  }

  // Area + line helper
  function drawArea(data, color) {
    const pts = data.slice(0, plotDays);
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(xP(0), yP(0));
    pts.forEach((v, i) => ctx.lineTo(xP(i), yP(v)));
    ctx.lineTo(xP(plotDays - 1), H - PAD.bottom);
    ctx.lineTo(xP(0), H - PAD.bottom);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom);
    grad.addColorStop(0, color + "50");
    grad.addColorStop(1, color + "00");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pts.forEach((v, i) => {
      if (i === 0) ctx.moveTo(xP(i), yP(v));
      else {
        const cx = (xP(i - 1) + xP(i)) / 2;
        ctx.bezierCurveTo(cx, yP(pts[i - 1]), cx, yP(v), xP(i), yP(v));
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    // End dot
    const lv = pts[plotDays - 1];
    ctx.beginPath();
    ctx.arc(xP(plotDays - 1), yP(lv), 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // End label
    ctx.fillStyle = color;
    ctx.font = `700 ${W < 360 ? 10 : 11}px Outfit`;
    const atRight = xP(plotDays - 1) > W - 80;
    ctx.textAlign = atRight ? "right" : "left";
    ctx.fillText(fmtK(lv), xP(plotDays - 1) + (atRight ? -10 : 10), yP(lv) - 8);
  }

  drawArea(cumI, "#00c48c");
  drawArea(cumE, "#f24e4e");

  // Today marker
  ctx.strokeStyle = "#5c3bfe55";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(xP(todayDate - 1), PAD.top);
  ctx.lineTo(xP(todayDate - 1), H - PAD.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#5c3bfe99";
  ctx.font = "600 10px Outfit";
  ctx.textAlign = "center";
  ctx.fillText("Today", xP(todayDate - 1), PAD.top - 5);

  // Hover crosshair
  if (hoverIdx >= 0 && hoverIdx < plotDays) {
    const hx = xP(hoverIdx);
    const hI = cumI[hoverIdx],
      hE = cumE[hoverIdx];

    // Vertical crosshair line
    ctx.strokeStyle = "rgba(92,59,254,0.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(hx, PAD.top);
    ctx.lineTo(hx, H - PAD.bottom);
    ctx.stroke();

    // Horizontal dashes to y-axis
    function hDash(yVal, color) {
      ctx.strokeStyle = color + "55";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(PAD.left, yP(yVal));
      ctx.lineTo(hx, yP(yVal));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    hDash(hI, "#00c48c");
    hDash(hE, "#f24e4e");

    // Dots on lines at hover point
    [
      [hI, "#00c48c"],
      [hE, "#f24e4e"],
    ].forEach(([v, c]) => {
      ctx.beginPath();
      ctx.arc(hx, yP(v), 6, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
  }
}

// ── CHART HOVER HANDLER ──
function initChartHover() {
  const canvas = document.getElementById("forecastChart");
  const tooltip = document.getElementById("chartTooltip");

  function onMove(e) {
    const d = _chartData;
    if (!d.xP || !d.plotDays) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    // Find nearest day index
    const cW = d.W - d.PAD.left - d.PAD.right;
    if (mx < d.PAD.left || mx > d.PAD.left + cW) {
      hideTooltip();
      return;
    }
    const raw = ((mx - d.PAD.left) / cW) * (d.daysInMonth - 1);
    const idx = Math.max(0, Math.min(Math.round(raw), d.plotDays - 1));

    // Update tooltip content
    const dayNum = idx + 1;
    const dateStr = new Date(d.year, d.month, dayNum).toLocaleDateString(
      "en-IN",
      { day: "numeric", month: "short", year: "numeric" },
    );
    const inc = d.cumI[idx],
      exp = d.cumE[idx];
    const bal = inc - exp;

    document.getElementById("ct-date").textContent = dateStr;
    document.getElementById("ct-income").textContent = fmt(inc);
    document.getElementById("ct-expense").textContent = fmt(exp);
    const balEl = document.getElementById("ct-balance");
    balEl.textContent = (bal >= 0 ? "+" : "-") + fmt(Math.abs(bal));
    balEl.style.color = bal >= 0 ? "#00c48c" : "#ff6b6b";

    // Position tooltip
    tooltip.style.display = "block";
    const tw = tooltip.offsetWidth || 168;
    const th = tooltip.offsetHeight || 110;
    const wrap = canvas.parentElement;
    const wW = wrap.clientWidth;
    let tx = mx + 14;
    if (tx + tw > wW - 4) tx = mx - tw - 14;
    let ty = my - th / 2;
    if (ty < 4) ty = 4;
    if (ty + th > d.H - 4) ty = d.H - th - 4;
    tooltip.style.left = tx + "px";
    tooltip.style.top = ty + "px";

    // Redraw with hover
    const ctx2 = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    _redrawChart(
      ctx2,
      d.W,
      d.H,
      d.PAD,
      d.W - d.PAD.left - d.PAD.right,
      d.H - d.PAD.top - d.PAD.bottom,
      d.daysInMonth,
      d.todayDate,
      d.plotDays,
      d.xP,
      d.yP,
      d.maxV,
      d.cumI,
      d.cumE,
      idx,
    );
  }

  function hideTooltip() {
    tooltip.style.display = "none";
    const d = _chartData;
    if (!d.xP) return;
    const ctx2 = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    _redrawChart(
      ctx2,
      d.W,
      d.H,
      d.PAD,
      d.W - d.PAD.left - d.PAD.right,
      d.H - d.PAD.top - d.PAD.bottom,
      d.daysInMonth,
      d.todayDate,
      d.plotDays,
      d.xP,
      d.yP,
      d.maxV,
      d.cumI,
      d.cumE,
      -1,
    );
  }

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("touchmove", onMove, { passive: true });
  canvas.addEventListener("mouseleave", hideTooltip);
  canvas.addEventListener("touchend", hideTooltip);
}
// Init hover once DOM ready
setTimeout(initChartHover, 100);
function fmtK(n) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(0) + "K";
  return "₹" + Math.round(n);
}

function renderBreakdown() {
  const expenses = state.transactions.filter((t) => t.type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const el = document.getElementById("breakdownList");
  if (!expenses.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><h3>No spending data yet</h3><p>Add transactions to see your breakdown</p></div>`;
    return;
  }
  const cats = {};
  expenses.forEach((t) => {
    if (!cats[t.cat]) cats[t.cat] = { amount: 0, count: 0 };
    cats[t.cat].amount += t.amount;
    cats[t.cat].count++;
  });
  const sorted = Object.entries(cats).sort((a, b) => b[1].amount - a[1].amount);
  el.innerHTML = sorted
    .map(([cat, { amount, count }]) => {
      const pct = total ? ((amount / total) * 100).toFixed(1) : 0;
      const color = CAT_COLORS[cat] || "#94a3b8";
      return `<div class="breakdown-item">
      <div class="breakdown-row">
        <div class="breakdown-label">
          <div class="breakdown-dot" style="background:${color}"></div>
          <span>${CAT_EMOJI[cat] || "📦"} ${cat}</span>
          <span class="breakdown-meta">(${count} tx)</span>
        </div>
        <div class="breakdown-vals">
          <div class="breakdown-amount">${fmt(amount)}</div>
          <div class="breakdown-pct">${pct}%</div>
        </div>
      </div>
      <div class="breakdown-bar-bg"><div class="breakdown-bar" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
    })
    .join("");
}

function formatDate(ds) {
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}
function renderAll() {
  renderHome();
  renderTransactions();
  renderBreakdown();
  if (document.getElementById("page-forecast").classList.contains("active"))
    drawChart();
}

document.querySelectorAll(".modal-overlay").forEach((o) =>
  o.addEventListener("click", (e) => {
    if (e.target === o) o.classList.remove("open");
  }),
);
let rTimer;
window.addEventListener("resize", () => {
  clearTimeout(rTimer);
  rTimer = setTimeout(() => {
    if (document.getElementById("page-forecast").classList.contains("active"))
      drawChart();
  }, 80);
});

const today = new Date().toISOString().split("T")[0];
const pastDay = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const hasSavedData = loadState();

if (!hasSavedData) {
  // First visit — load seed data
  state.transactions = [
    // {id:1,  name:'Monthly Salary',   amount:85000,cat:'Income',        date:pastDay(15),type:'income'},
    // {id:2,  name:'Freelance Project',amount:12000,cat:'Income',        date:pastDay(8), type:'income'},
    // {id:3,  name:'Rent',             amount:6000, cat:'Housing',       date:pastDay(12),type:'expense'},
    // {id:4,  name:'Electricity Bill', amount:600,  cat:'Utilities',     date:pastDay(10),type:'expense'},
    // {id:5,  name:'BigBasket',        amount:2500, cat:'Groceries',     date:pastDay(7), type:'expense'},
    // {id:6,  name:'Myntra',           amount:1200, cat:'Shopping',      date:pastDay(5), type:'expense'},
    // {id:7,  name:'Swiggy',           amount:450,  cat:'Food & Dining', date:pastDay(3), type:'expense'},
    // {id:8,  name:'Ola',              amount:850,  cat:'Transportation',date:pastDay(2), type:'expense'},
    // {id:9,  name:'Apollo Pharmacy',  amount:1500, cat:'Health',        date:pastDay(1), type:'expense'},
    // {id:10, name:'H&M',              amount:3200, cat:'Shopping',      date:today,      type:'expense'},
    // {id:11, name:'Zomato',           amount:320,  cat:'Food & Dining', date:today,      type:'expense'},
    // {id:12, name:'Netflix',          amount:499,  cat:'Entertainment', date:pastDay(4), type:'expense'},
    // {id:13, name:'Coursera',         amount:1800, cat:'Education',     date:pastDay(6), type:'expense'},
    // {id:14, name:'Cult.fit',         amount:1200, cat:'Fitness',       date:pastDay(9), type:'expense'},
  ];
  saveState();
}

// Navbar always shows Wallet / W — only greeting reflects the user's name
document.getElementById("homeGreeting").textContent =
  "Hi, " + state.userName + " 👋";

renderAll();
