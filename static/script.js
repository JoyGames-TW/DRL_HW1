/**
 * script.js — MDP 網格地圖 HW1
 * 前端互動邏輯：網格渲染、點擊操作、API 呼叫
 */

'use strict';

// ── 狀態 ──────────────────────────────────────
const state = {
  n: 5,
  start: null,
  goal: null,
  obstacles: [],
  mode: 'start',        // 'start'|'goal'|'obstacle'|'clear'
  policy: null,         // {\"r,c\": symbol}
  values: null,         // {\"r,c\": number}
  showPolicy: true,
  showValue: true,
  phase: 'setup',       // 'setup'|'random_policy'|'value_iteration'
};

// ── DOM 元素 ───────────────────────────────────
const gridContainer  = document.getElementById('grid-container');
const modeGroup      = document.getElementById('mode-group');
const algoGroup      = document.getElementById('algo-group');
const displayGroup   = document.getElementById('display-group');
const gridWrapper    = document.getElementById('grid-wrapper');
const legend         = document.getElementById('legend');
const obstacleInfo   = document.getElementById('obstacle-info');
const messageBox     = document.getElementById('message-box');
const togglePolicy   = document.getElementById('toggle-policy');
const toggleValue    = document.getElementById('toggle-value');

// ── 訊息顯示 ──────────────────────────────────
let msgTimer = null;
function showMessage(text, type = 'info', duration = 3000) {
  messageBox.textContent = text;
  messageBox.className = `message-box ${type}`;
  messageBox.style.display = 'block';
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { messageBox.style.display = 'none'; }, duration);
}

// ── 初始化網格 ────────────────────────────────
document.getElementById('btn-init').addEventListener('click', async () => {
  const n = parseInt(document.getElementById('grid-size').value, 10);

  const res = await fetch('/api/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ n }),
  });
  const data = await res.json();
  if (data.status !== 'ok') { showMessage(data.message, 'error'); return; }

  // 重置 state
  state.n = n;
  state.start = null;
  state.goal = null;
  state.obstacles = [];
  state.policy = null;
  state.values = null;
  state.phase = 'setup';

  renderGrid();

  modeGroup.style.display  = 'flex';
  algoGroup.style.display  = 'flex';
  displayGroup.style.display = 'flex';
  gridWrapper.style.display = 'flex';
  legend.style.display     = 'block';

  updateObstacleInfo();
  showMessage(`已初始化 ${n}×${n} 網格，請設定起點與終點`, 'success');
});

// ── 模式按鈕 ──────────────────────────────────
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
  });
});

// ── 重置設定 ──────────────────────────────────
document.getElementById('btn-reset').addEventListener('click', async () => {
  const n = state.n;
  await fetch('/api/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ n }),
  });
  state.start = null;
  state.goal = null;
  state.obstacles = [];
  state.policy = null;
  state.values = null;
  state.phase = 'setup';
  renderGrid();
  updateObstacleInfo();
  showMessage('已重置所有設定', 'info');
});

// ── 顯示選項切換 ──────────────────────────────
togglePolicy.addEventListener('change', () => {
  state.showPolicy = togglePolicy.checked;
  refreshCellDisplay();
});
toggleValue.addEventListener('change', () => {
  state.showValue = toggleValue.checked;
  refreshCellDisplay();
});

// ── HW1-2：隨機策略 ───────────────────────────
document.getElementById('btn-random-policy').addEventListener('click', async () => {
  if (!state.start || !state.goal) {
    showMessage('請先設定起點與終點！', 'error'); return;
  }
  showMessage('正在計算隨機策略與策略評估…', 'info', 8000);

  const res = await fetch('/api/random_policy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (data.status !== 'ok') { showMessage(data.message, 'error'); return; }

  state.policy = data.policy_symbols;
  state.values = data.values;
  state.phase  = 'random_policy';
  refreshCellDisplay();
  showMessage('隨機策略與 V(s) 已顯示（策略評估完成）', 'success', 5000);
});

// ── HW1-3：價值迭代 ───────────────────────────
document.getElementById('btn-value-iter').addEventListener('click', async () => {
  if (!state.start || !state.goal) {
    showMessage('請先設定起點與終點！', 'error'); return;
  }
  showMessage('正在執行價值迭代演算法…', 'info', 8000);

  const res = await fetch('/api/value_iteration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (data.status !== 'ok') { showMessage(data.message, 'error'); return; }

  state.policy = data.policy_symbols;
  state.values = data.values;
  state.phase  = 'value_iteration';
  refreshCellDisplay();
  showMessage('最佳策略與最佳 V(s) 已更新（價值迭代完成）', 'success', 5000);
});

// ── 渲染網格 ──────────────────────────────────
function renderGrid() {
  gridContainer.innerHTML = '';
  gridContainer.style.gridTemplateColumns = `repeat(${state.n}, 1fr)`;

  for (let r = 0; r < state.n; r++) {
    for (let c = 0; c < state.n; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;

      // 標籤（r,c）
      const label = document.createElement('span');
      label.className = 'cell-label';
      label.textContent = `${r},${c}`;
      cell.appendChild(label);

      // 箭頭
      const arrow = document.createElement('span');
      arrow.className = 'cell-arrow';
      cell.appendChild(arrow);

      // 數值
      const valEl = document.createElement('span');
      valEl.className = 'cell-value';
      cell.appendChild(valEl);

      cell.addEventListener('click', onCellClick);
      gridContainer.appendChild(cell);
    }
  }
  updateAllCells();
}

// ── 點擊格子 ──────────────────────────────────
async function onCellClick(e) {
  const cell = e.currentTarget;
  const r = parseInt(cell.dataset.r, 10);
  const c = parseInt(cell.dataset.c, 10);

  const res = await fetch('/api/set_cell', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ r, c, type: state.mode }),
  });
  const data = await res.json();

  if (data.status !== 'ok') {
    showMessage(data.message, 'error'); return;
  }

  state.start     = data.start;
  state.goal      = data.goal;
  state.obstacles = data.obstacles;

  updateObstacleInfo();
  updateAllCells();

  const modeNames = { start: '起點', goal: '終點', obstacle: '障礙物', clear: '清除' };
  showMessage(`[${r},${c}] 已設為 ${modeNames[state.mode]}`, 'success', 1500);
}

// ── 更新所有格子外觀 ──────────────────────────
function updateAllCells() {
  const obstacleSet = new Set(state.obstacles.map(([r, c]) => `${r},${c}`));

  document.querySelectorAll('.cell').forEach(cell => {
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);
    const key = `${r},${c}`;

    // 清除狀態類別
    cell.classList.remove('start', 'goal', 'obstacle');
    cell.removeAttribute('data-valclass');

    if (state.start && state.start[0] === r && state.start[1] === c) {
      cell.classList.add('start');
      cell.querySelector('.cell-label').textContent = 'S';
    } else if (state.goal && state.goal[0] === r && state.goal[1] === c) {
      cell.classList.add('goal');
      cell.querySelector('.cell-label').textContent = 'G';
    } else if (obstacleSet.has(key)) {
      cell.classList.add('obstacle');
      cell.querySelector('.cell-label').textContent = '■';
    } else {
      cell.querySelector('.cell-label').textContent = `${r},${c}`;
    }

    // 策略箭頭
    const arrowEl = cell.querySelector('.cell-arrow');
    if (state.showPolicy && state.policy && state.policy[key]) {
      arrowEl.textContent = state.policy[key];
      arrowEl.style.opacity = '1';
    } else {
      arrowEl.textContent = '';
      arrowEl.style.opacity = '0';
    }

    // V(s) 數值
    const valEl = cell.querySelector('.cell-value');
    if (state.showValue && state.values && state.values[key] !== undefined) {
      valEl.textContent = state.values[key].toFixed(2);
      valEl.style.opacity = '1';
      applyHeatColor(cell, state.values[key]);
    } else {
      valEl.textContent = '';
      valEl.style.opacity = '0';
    }
  });
}

// ── 僅刷新顯示（不重新請求API）────────────────
function refreshCellDisplay() {
  updateAllCells();
}

// ── 熱力圖著色 ────────────────────────────────
function applyHeatColor(cell, value) {
  if (cell.classList.contains('obstacle') ||
      cell.classList.contains('start') ||
      cell.classList.contains('goal')) return;

  cell.removeAttribute('data-valclass');
  if (value >= 3)       cell.setAttribute('data-valclass', 'high');
  else if (value >= 0)  cell.setAttribute('data-valclass', 'medium');
  else                  cell.setAttribute('data-valclass', 'low');
}

// ── 更新障礙物計數顯示 ────────────────────────
function updateObstacleInfo() {
  const max = state.n - 2;
  obstacleInfo.textContent = `障礙物：${state.obstacles.length} / ${max}`;
  obstacleInfo.style.background = state.obstacles.length >= max ? '#fbd38d' : '#e2e8f0';
}
