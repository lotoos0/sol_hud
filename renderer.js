const PASSIVE_TIMEOUT = 5 * 60 * 1000;
const HEART_FULL = '\u2764\uFE0F';
const HEART_EMPTY = '\uD83D\uDDA4';

function createDefaultSession() {
  return {
    id: null,
    lives: 3,
    maxLives: 3,
    attempts: 0,
    wins: 0,
    losses: 0,
    pnl_sol: 0,
    passiveEvents: 0,
    slHits: 0,
    locked: false,
    expanded: false,
    checklist: {
      chart: false,
      narrative: false,
      bubblemap: false,
      holders: false
    },
    trades: [],
    startedAt: null,
    endedAt: null,
    windowPos: { x: 10, y: 10 },
    config: {}
  };
}

const session = createDefaultSession();

let passiveTimer = null;

const startScreen = document.getElementById('start-screen');
const livesInput = document.getElementById('cfg-lives');
const solInput = document.getElementById('cfg-sol');
const startButton = document.getElementById('btn-start');
const hudContainer = document.getElementById('hud-container');
const miniBar = document.getElementById('mini-bar');
const expandedPanel = document.getElementById('expanded-panel');
const expandButton = document.getElementById('btn-expand');
const collapseButton = document.getElementById('btn-collapse');
const entryButton = document.getElementById('btn-entry');
const passButton = document.getElementById('btn-pass');
const slButton = document.getElementById('btn-sl');
const endSessionButton = document.getElementById('btn-end-session');
const summaryScreen = document.getElementById('summary-screen');
const summaryStats = document.getElementById('summary-stats');
const endExportButton = document.getElementById('btn-end-export');
const endOnlyButton = document.getElementById('btn-end-only');
const pnlInput = document.getElementById('pnl-input');
const pnlDisplay = document.getElementById('pnl-display');
const statsMini = document.querySelector('.stats-mini');
const statsCards = Array.from(document.querySelectorAll('.stats-grid > div'));
const checklistInputs = Array.from(document.querySelectorAll('.checklist input'));
const checklistKeys = ['chart', 'narrative', 'bubblemap', 'holders'];

const sessionOver = document.getElementById('session-over');

function validateStartInputs() {
  const lives = Number(livesInput.value);
  const solLimit = Number(solInput.value);
  const livesErr = !Number.isInteger(lives) || lives < 1 || lives > 5;
  const solErr = !Number.isFinite(solLimit) || solLimit < 0.01 || solLimit > 10.0;
  const valid = !livesErr && !solErr;

  livesInput.classList.toggle('input-error', livesErr);
  solInput.classList.toggle('input-error', solErr);
  startButton.disabled = !valid;

  return { valid, livesErr, solErr };
}

async function generateSessionId() {
  const today = new Date().toISOString().slice(0, 10);
  let sessionIds = [];

  try {
    sessionIds = await window.electronAPI.getSessionIds();
  } catch {
    sessionIds = [];
  }

  const suffixes = sessionIds
    .filter((id) => id.startsWith(`${today}_`))
    .map((id) => Number(id.slice(today.length + 1)))
    .filter((value) => Number.isInteger(value));
  const next = suffixes.length > 0 ? Math.max(...suffixes) + 1 : 1;

  return `${today}_${String(next).padStart(3, '0')}`;
}

async function ensureSessionId() {
  if (!session.id) {
    session.id = await generateSessionId();
  }
}

function currentPosition() {
  return session.windowPos;
}

function buildSessionJSON() {
  const winRate =
    session.attempts === 0 ? '0.0' : ((session.wins / session.attempts) * 100).toFixed(1);

  return {
    session_id: session.id,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    config: session.config,
    summary: {
      attempts: session.attempts,
      wins: session.wins,
      losses: session.losses,
      pnl_sol: session.pnl_sol,
      win_rate: winRate,
      passive_events: session.passiveEvents,
      sl_hits: session.slHits
    },
    trades: session.trades,
    window_position: currentPosition()
  };
}

async function autoSave() {
  if (!session.startedAt) {
    return;
  }

  try {
    await ensureSessionId();
    await window.electronAPI.saveSession(buildSessionJSON());
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
}

function renderHearts() {
  const hearts = Array.from({ length: session.maxLives }, (_item, index) => {
    return index < session.lives ? HEART_FULL : HEART_EMPTY;
  }).join('');

  document.querySelectorAll('.lives-display, .lives-row').forEach((el) => {
    el.textContent = hearts;
  });
}

function getWinRate() {
  if (session.attempts === 0) {
    return 0;
  }

  return Math.round((session.wins / session.attempts) * 100);
}

function renderStats() {
  const winRate = getWinRate();
  statsMini.textContent = `W:${session.wins} L:${session.losses} ${winRate}%`;

  const values = [
    session.attempts,
    session.wins,
    `${winRate}%`,
    session.passiveEvents
  ];

  statsCards.forEach((card, index) => {
    const value = card.querySelector('strong');

    if (value) {
      value.textContent = values[index];
    }
  });
}

function renderPnL() {
  const isPositive = session.pnl_sol >= 0;

  pnlDisplay.textContent = `P&L: ${session.pnl_sol.toFixed(3)} SOL`;
  pnlDisplay.classList.toggle('pnl-positive', isPositive);
  pnlDisplay.classList.toggle('pnl-negative', !isPositive);
}

function renderChecklist() {
  checklistKeys.forEach((key, index) => {
    const input = checklistInputs[index];

    if (input) {
      input.checked = session.checklist[key];
    }
  });

  checkEntryUnlock();
}

function checkEntryUnlock() {
  const checkedCount = Object.values(session.checklist).filter(Boolean).length;
  entryButton.disabled = session.locked || checkedCount < 3;
  passButton.disabled = session.locked;
  slButton.disabled = session.locked;
}

function resetChecklist() {
  session.checklist = {
    chart: false,
    narrative: false,
    bubblemap: false,
    holders: false
  };

  renderChecklist();
}

function lockSession() {
  session.locked = true;
  entryButton.disabled = true;
  passButton.disabled = true;
  slButton.disabled = true;
  sessionOver.hidden = false;
  session.expanded = true;
  hudContainer.classList.add('is-expanded', 'is-locked');
  expandedPanel.hidden = false;
  miniBar.hidden = true;
  window.electronAPI.resizeWindow(320);
}

function readPnlAmount() {
  const value = Number.parseFloat(pnlInput.value);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.abs(value);
}

function logTrade(type, pnlAmount = 0) {
  if (!session.startedAt) {
    session.startedAt = new Date().toISOString();
  }

  session.trades.push({
    type,
    at: new Date().toISOString(),
    lives: session.lives,
    attempts: session.attempts,
    wins: session.wins,
    losses: session.losses,
    pnl_amount: pnlAmount
  });
}

function resetPassiveTimer() {
  if (!session.startedAt) {
    return;
  }

  clearTimeout(passiveTimer);
  hudContainer.classList.remove('passive-alert');

  passiveTimer = setTimeout(() => {
    session.passiveEvents++;
    hudContainer.classList.add('passive-alert');
    renderStats();
    autoSave();
  }, PASSIVE_TIMEOUT);
}

function renderAll() {
  renderHearts();
  renderStats();
  renderPnL();
  renderChecklist();

  if (session.locked) {
    lockSession();
  }
}

async function onEntry() {
  if (session.locked || !session.startedAt) {
    return;
  }

  session.attempts++;
  session.wins++;
  const pnlAmount = readPnlAmount();
  session.pnl_sol += pnlAmount;
  logTrade('ENTRY', pnlAmount);
  pnlInput.value = '';
  resetChecklist();
  resetPassiveTimer();
  renderAll();
  await autoSave();
}

async function onPass() {
  if (session.locked || !session.startedAt) {
    return;
  }

  session.attempts++;
  session.losses++;
  logTrade('PASS');
  resetChecklist();
  resetPassiveTimer();
  renderAll();
  await autoSave();
}

async function onSL() {
  if (session.locked || !session.startedAt) {
    return;
  }

  session.lives--;
  session.slHits++;
  session.attempts++;
  session.losses++;
  const pnlAmount = readPnlAmount();
  session.pnl_sol -= pnlAmount;
  logTrade('SL', pnlAmount);
  pnlInput.value = '';
  resetChecklist();
  resetPassiveTimer();

  if (session.lives <= 0) {
    session.lives = 0;
    lockSession();
  }

  renderAll();
  await autoSave();
}

expandButton.addEventListener('click', () => {
  if (!session.startedAt) {
    return;
  }

  session.expanded = true;
  hudContainer.classList.add('is-expanded');
  expandedPanel.hidden = false;
  miniBar.hidden = true;
  window.electronAPI.resizeWindow(400);
  window.electronAPI.setIgnoreMouse(false);
});

collapseButton.addEventListener('click', () => {
  if (!session.startedAt) {
    return;
  }

  session.expanded = false;
  hudContainer.classList.remove('is-expanded');
  expandedPanel.hidden = true;
  miniBar.hidden = false;
  window.electronAPI.resizeWindow(44);
  window.electronAPI.setIgnoreMouse(false);
});

checklistInputs.forEach((input, index) => {
  input.addEventListener('change', () => {
    const key = checklistKeys[index];
    session.checklist[key] = input.checked;
    checkEntryUnlock();
  });
});

entryButton.addEventListener('click', onEntry);
passButton.addEventListener('click', onPass);
slButton.addEventListener('click', onSL);

endSessionButton.addEventListener('click', showSummary);

endExportButton.addEventListener('click', async () => {
  await window.electronAPI.openSessionsFolder();
  resetToStartScreen();
});

endOnlyButton.addEventListener('click', resetToStartScreen);

startButton.addEventListener('click', async () => {
  const { valid } = validateStartInputs();

  if (!valid) {
    return;
  }

  startButton.disabled = true;
  const lives = Number(livesInput.value);
  const solLimit = Number(solInput.value);
  await initSession({ lives, solLimit });
  startScreen.hidden = true;
  hudContainer.hidden = false;
  await window.electronAPI.resizeWindow(44);
  window.electronAPI.setIgnoreMouse(false);
});

document.addEventListener('mousemove', (e) => {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const inInteractiveArea = el && el.closest('#hud-container, #start-screen');
  window.electronAPI.setIgnoreMouse(!inInteractiveArea);
});

window.electronAPI.onWindowPositionChanged((pos) => {
  session.windowPos = pos;
});

async function initSession(config) {
  const windowPos = session.windowPos;
  Object.assign(session, createDefaultSession(), {
    id: await generateSessionId(),
    lives: config.lives,
    maxLives: config.lives,
    startedAt: new Date().toISOString(),
    windowPos,
    config: {
      lives: config.lives,
      sol_limit: config.solLimit
    }
  });

  sessionOver.hidden = true;
  summaryScreen.hidden = true;
  endSessionButton.hidden = false;
  hudContainer.classList.remove('is-expanded', 'is-locked', 'is-summary', 'passive-alert');
  expandedPanel.hidden = true;
  miniBar.hidden = false;
  resetPassiveTimer();
  renderAll();
}

async function showSummary() {
  if (!session.startedAt) {
    return;
  }

  session.endedAt = new Date().toISOString();
  session.locked = true;
  clearTimeout(passiveTimer);
  renderAll();
  await autoSave();

  const winRate =
    session.attempts === 0 ? '0.0' : ((session.wins / session.attempts) * 100).toFixed(1);

  summaryStats.innerHTML = `
    <p>Attempts: ${session.attempts} | Wins: ${session.wins} | Losses: ${session.losses}</p>
    <p>Win Rate: ${winRate}% | SL Hits: ${session.slHits}</p>
    <p>Passive Events: ${session.passiveEvents}</p>
    <p>Session File: sessions/${session.id}.json</p>
  `;

  summaryScreen.hidden = false;
  sessionOver.hidden = true;
  endSessionButton.hidden = true;
  session.expanded = true;
  hudContainer.classList.add('is-expanded', 'is-summary');
  hudContainer.classList.remove('is-locked');
  expandedPanel.hidden = false;
  miniBar.hidden = true;
  window.electronAPI.resizeWindow(400);
}

function resetToStartScreen() {
  const windowPos = session.windowPos;
  Object.assign(session, createDefaultSession(), { windowPos });
  clearTimeout(passiveTimer);
  summaryScreen.hidden = true;
  sessionOver.hidden = true;
  endSessionButton.hidden = false;
  hudContainer.hidden = true;
  hudContainer.classList.remove('is-expanded', 'is-locked', 'is-summary', 'passive-alert');
  expandedPanel.hidden = true;
  miniBar.hidden = false;
  startScreen.hidden = false;
  startButton.disabled = false;
  window.electronAPI.resizeWindow(180);
  window.electronAPI.setIgnoreMouse(false);
  renderAll();
}

[livesInput, solInput].forEach((input) => {
  input.addEventListener('input', validateStartInputs);
});

async function init() {
  try {
    session.windowPos = await window.electronAPI.loadLastPosition();
  } catch {
    session.windowPos = { x: 10, y: 10 };
  }

  hudContainer.hidden = true;
  startScreen.hidden = false;
  await window.electronAPI.resizeWindow(180);
  window.electronAPI.setIgnoreMouse(false);
  validateStartInputs();
  renderAll();
}

init();
