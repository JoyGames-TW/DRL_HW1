const state = {
  n: 5,
  start: null,
  end: null,
  obstacles: new Set(),
  mode: "start",
};

const modeLabels = {
  start: "Set Start",
  end: "Set End",
  obstacle: "Toggle Obstacle",
};

const arrowMap = {
  U: "&uarr;",
  D: "&darr;",
  L: "&larr;",
  R: "&rarr;",
  S: "START",
  E: "END",
  X: "X",
  "": "",
};

const elements = {
  gridSize: document.getElementById("gridSize"),
  gamma: document.getElementById("gamma"),
  theta: document.getElementById("theta"),
  generateGridBtn: document.getElementById("generateGridBtn"),
  randomPolicyBtn: document.getElementById("randomPolicyBtn"),
  valueIterationBtn: document.getElementById("valueIterationBtn"),
  resetResultBtn: document.getElementById("resetResultBtn"),
  gridContainer: document.getElementById("gridContainer"),
  modeStatus: document.getElementById("modeStatus"),
  startStatus: document.getElementById("startStatus"),
  endStatus: document.getElementById("endStatus"),
  obstacleStatus: document.getElementById("obstacleStatus"),
  message: document.getElementById("message"),
  policyContainer: document.getElementById("policyContainer"),
  valueContainer: document.getElementById("valueContainer"),
  policyCaption: document.getElementById("policyCaption"),
  valueCaption: document.getElementById("valueCaption"),
  modeButtons: Array.from(document.querySelectorAll(".mode-btn")),
};

function key(row, col) {
  return `${row},${col}`;
}

function parseKey(raw) {
  const [r, c] = raw.split(",").map(Number);
  return [r, c];
}

function obstacleLimit() {
  return state.n - 2;
}

function clearResults() {
  elements.policyContainer.innerHTML = "";
  elements.valueContainer.innerHTML = "";
  elements.policyCaption.textContent = "No result yet.";
  elements.valueCaption.textContent = "No result yet.";
}

function showMessage(text, type = "success") {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`;
}

function pointToLabel(point) {
  if (!point) {
    return "Not set";
  }
  return `(${point[0]}, ${point[1]})`;
}

function updateStatus() {
  elements.startStatus.textContent = pointToLabel(state.start);
  elements.endStatus.textContent = pointToLabel(state.end);
  elements.obstacleStatus.textContent = `${state.obstacles.size} / ${obstacleLimit()}`;
  elements.modeStatus.textContent = modeLabels[state.mode];
}

function resetGridData(newN) {
  state.n = newN;
  state.start = null;
  state.end = null;
  state.obstacles = new Set();
}

function renderGrid() {
  elements.gridContainer.innerHTML = "";
  elements.gridContainer.style.gridTemplateColumns = `repeat(${state.n}, 1fr)`;

  for (let row = 0; row < state.n; row += 1) {
    for (let col = 0; col < state.n; col += 1) {
      const cell = document.createElement("div");
      const cellKey = key(row, col);
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.className = "cell normal";

      if (state.start && row === state.start[0] && col === state.start[1]) {
        cell.className = "cell start";
        cell.textContent = "S";
      } else if (state.end && row === state.end[0] && col === state.end[1]) {
        cell.className = "cell end";
        cell.textContent = "E";
      } else if (state.obstacles.has(cellKey)) {
        cell.className = "cell obstacle";
        cell.textContent = "#";
      }

      cell.addEventListener("click", () => onCellClick(row, col));
      elements.gridContainer.appendChild(cell);
    }
  }

  updateStatus();
}

function onCellClick(row, col) {
  const clicked = [row, col];
  const clickedKey = key(row, col);

  if (state.mode === "start") {
    if (state.end && row === state.end[0] && col === state.end[1]) {
      showMessage("Start cannot be the same as End.", "error");
      return;
    }

    if (state.obstacles.has(clickedKey)) {
      state.obstacles.delete(clickedKey);
    }

    state.start = clicked;
    showMessage("Start point updated.");
  }

  if (state.mode === "end") {
    if (state.start && row === state.start[0] && col === state.start[1]) {
      showMessage("End cannot be the same as Start.", "error");
      return;
    }

    if (state.obstacles.has(clickedKey)) {
      state.obstacles.delete(clickedKey);
    }

    state.end = clicked;
    showMessage("End point updated.");
  }

  if (state.mode === "obstacle") {
    const isStart = state.start && row === state.start[0] && col === state.start[1];
    const isEnd = state.end && row === state.end[0] && col === state.end[1];

    if (isStart || isEnd) {
      showMessage("Cannot place an obstacle on Start/End.", "error");
      return;
    }

    if (state.obstacles.has(clickedKey)) {
      state.obstacles.delete(clickedKey);
      showMessage("Obstacle removed.");
    } else {
      if (state.obstacles.size >= obstacleLimit()) {
        showMessage(`Obstacle limit reached: ${obstacleLimit()}.`, "error");
        return;
      }
      state.obstacles.add(clickedKey);
      showMessage("Obstacle added.");
    }
  }

  renderGrid();
}

function setMode(mode) {
  state.mode = mode;
  elements.modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  updateStatus();
}

function validateBeforeRun() {
  if (!state.start) {
    showMessage("Please set Start first.", "error");
    return false;
  }

  if (!state.end) {
    showMessage("Please set End first.", "error");
    return false;
  }

  if (state.obstacles.size !== obstacleLimit()) {
    showMessage(
      `You must place exactly ${obstacleLimit()} obstacles (currently ${state.obstacles.size}).`,
      "error"
    );
    return false;
  }

  return true;
}

function payload() {
  const obstacles = Array.from(state.obstacles).map(parseKey);
  return {
    n: state.n,
    start: state.start,
    end: state.end,
    obstacles,
    gamma: Number(elements.gamma.value),
    theta: Number(elements.theta.value),
    maxIterations: 1000,
  };
}

function matrixCellClass(symbol) {
  if (symbol === "S") {
    return "start";
  }
  if (symbol === "E") {
    return "end";
  }
  if (symbol === "X") {
    return "obstacle";
  }
  return "";
}

function renderPolicyMatrix(matrix) {
  const table = document.createElement("table");
  table.className = "matrix";

  matrix.forEach((row) => {
    const tr = document.createElement("tr");

    row.forEach((symbol) => {
      const td = document.createElement("td");
      td.className = matrixCellClass(symbol);
      td.innerHTML = arrowMap[symbol] ?? symbol;
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  elements.policyContainer.innerHTML = "";
  elements.policyContainer.appendChild(table);
}

function renderValueMatrix(matrix, policyMatrix) {
  const table = document.createElement("table");
  table.className = "matrix";

  matrix.forEach((row, rIndex) => {
    const tr = document.createElement("tr");

    row.forEach((value, cIndex) => {
      const td = document.createElement("td");
      const symbol = policyMatrix[rIndex][cIndex];
      td.className = matrixCellClass(symbol);

      if (value === null) {
        td.textContent = "X";
      } else {
        td.textContent = Number(value).toFixed(2);
      }

      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  elements.valueContainer.innerHTML = "";
  elements.valueContainer.appendChild(table);
}

async function runAlgorithm(endpoint, captionPrefix) {
  if (!validateBeforeRun()) {
    return;
  }

  showMessage("Running calculation...");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload()),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Request failed.");
    }

    renderPolicyMatrix(result.policy);
    renderValueMatrix(result.values, result.policy);

    elements.policyCaption.textContent = `${captionPrefix} (iterations: ${result.iterations}, gamma=${result.gamma}, theta=${result.theta})`;
    elements.valueCaption.textContent = `Computed V(s) under ${captionPrefix.toLowerCase()}.`;

    showMessage("Calculation complete.");
  } catch (error) {
    showMessage(error.message || "Unknown error", "error");
  }
}

function bindEvents() {
  elements.generateGridBtn.addEventListener("click", () => {
    const newN = Number(elements.gridSize.value);

    if (!Number.isInteger(newN) || newN < 5 || newN > 9) {
      showMessage("Grid size must be an integer between 5 and 9.", "error");
      return;
    }

    resetGridData(newN);
    clearResults();
    renderGrid();
    showMessage(`Generated ${newN} x ${newN} grid.`);
  });

  elements.modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  elements.randomPolicyBtn.addEventListener("click", () => {
    runAlgorithm("/api/random-policy", "Random Policy Evaluation");
  });

  elements.valueIterationBtn.addEventListener("click", () => {
    runAlgorithm("/api/value-iteration", "Optimal Policy (Value Iteration)");
  });

  elements.resetResultBtn.addEventListener("click", () => {
    clearResults();
    showMessage("Result panels cleared.");
  });
}

function init() {
  bindEvents();
  renderGrid();
  showMessage("Select a mode and click cells to configure the grid.");
}

init();
