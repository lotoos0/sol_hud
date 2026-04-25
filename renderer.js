const PASSIVE_TIMEOUT = 5 * 60 * 1000;
const RANK_TABLE = [
  { rank: 'Rookie', rank_level: 1, xp_required: 0, feature_unlock: 'basic_hud' },
  { rank: 'Scout', rank_level: 2, xp_required: 100, feature_unlock: 'session_history' },
  { rank: 'Operator', rank_level: 3, xp_required: 250, feature_unlock: 'quest_tracking' },
  { rank: 'Strategist', rank_level: 4, xp_required: 500, feature_unlock: 'boss_fights' },
  { rank: 'Specialist', rank_level: 5, xp_required: 900, feature_unlock: 'achievements' },
  { rank: 'Veteran', rank_level: 6, xp_required: 1400, feature_unlock: 'advanced_stats' },
  { rank: 'Legend', rank_level: 7, xp_required: 2200, feature_unlock: 'prestige' }
];
const XP_TABLE = {
  entry_4_4: 15,
  entry_3_4: 8,
  pass: 5,
  win_session: 30,
  no_passive_session: 20
};
const COIN_TABLE = {
  pass_with_reason: 5,
  entry_4_4: 10,
  sl_logged: 3,
  session_no_tilt: 15,
  session_with_review: 8
};
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
    isComeback: false,
    rewardsApplied: false,
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
let playerData = null;

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
const loginBonusToast = document.getElementById('login-bonus-toast');
const comebackBanner = document.getElementById('comeback-banner');

function getRankFromXP(xp) {
  const normalizedXP = Number.isFinite(xp) ? xp : 0;
  let currentRank = RANK_TABLE[0];

  for (const rank of RANK_TABLE) {
    if (normalizedXP < rank.xp_required) {
      return currentRank;
    }

    currentRank = rank;
  }

  return currentRank;
}

function getCheckedCount() {
  return Object.values(session.checklist).filter(Boolean).length;
}

function calcTradeXP(type, checkedCount) {
  if (type === 'ENTRY') {
    if (checkedCount >= 4) {
      return { xp: XP_TABLE.entry_4_4, coins: COIN_TABLE.entry_4_4 };
    }

    if (checkedCount >= 3) {
      return { xp: XP_TABLE.entry_3_4, coins: 0 };
    }
  }

  if (type === 'PASS') {
    return { xp: XP_TABLE.pass, coins: COIN_TABLE.pass_with_reason };
  }

  if (type === 'SL') {
    return { xp: 0, coins: COIN_TABLE.sl_logged };
  }

  return { xp: 0, coins: 0 };
}

function calcSessionXP(sessionSummary) {
  const wins = Number(sessionSummary.wins) || 0;
  const attempts = Number(sessionSummary.attempts) || 0;
  const passiveEvents = Number(sessionSummary.passiveEvents) || 0;
  let xp = 0;
  let coins = 0;

  if (attempts > 0 && wins > attempts - wins) {
    xp += XP_TABLE.win_session;
    coins += COIN_TABLE.session_no_tilt;
  }

  if (passiveEvents === 0) {
    xp += XP_TABLE.no_passive_session;
    coins += COIN_TABLE.session_with_review;
  }

  return { xp, coins };
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function daysDiff(fromDate, toDate) {
  if (!fromDate || !toDate) {
    return 0;
  }

  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T00:00:00.000Z`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return 0;
  }

  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

function yesterdayString() {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  return yesterday.toISOString().slice(0, 10);
}

function showToast(message) {
  if (!loginBonusToast) {
    return;
  }

  loginBonusToast.textContent = message;
  loginBonusToast.hidden = false;
  loginBonusToast.classList.remove('toast-flash');
  void loginBonusToast.offsetWidth;
  loginBonusToast.classList.add('toast-flash');

  setTimeout(() => {
    loginBonusToast.hidden = true;
  }, 3000);
}

function ensurePlayerShape(player) {
  const rank = getRankFromXP(Number(player.xp) || 0);
  const streakValue =
    typeof player.streak === 'number' ? player.streak : Number(player.streak?.current) || 0;
  const bestStreakValue =
    Number(player.best_streak) || Number(player.streak?.best) || streakValue || 0;

  player.xp = Number(player.xp) || 0;
  player.coins = Number(player.coins) || 0;
  player.rank = player.rank || rank.rank;
  player.rank_level = Number(player.rank_level) || Number(player.level) || rank.rank_level;
  player.level = Number(player.level) || rank.rank_level;
  player.streak = streakValue;
  player.best_streak = bestStreakValue;
  player.total_sessions = Number(player.total_sessions) || Number(player.stats?.sessions) || 0;
  player.total_attempts = Number(player.total_attempts) || Number(player.stats?.attempts) || 0;
  player.total_wins = Number(player.total_wins) || Number(player.stats?.wins) || 0;
  player.total_losses = Number(player.total_losses) || Number(player.stats?.losses) || 0;
  player.total_passive_events =
    Number(player.total_passive_events) || Number(player.stats?.passive_events) || 0;
  player.total_sl_hits = Number(player.total_sl_hits) || Number(player.stats?.sl_hits) || 0;
  player.total_pnl_sol = Number(player.total_pnl_sol) || Number(player.stats?.pnl_sol) || 0;
  player.last_session_date = player.last_session_date || null;
  player.rusty = Boolean(player.rusty);
  player.consecutive_days_off = Number(player.consecutive_days_off) || 0;
  player.stats = {
    ...(player.stats || {}),
    sessions: player.total_sessions,
    attempts: player.total_attempts,
    wins: player.total_wins,
    losses: player.total_losses,
    passive_events: player.total_passive_events,
    sl_hits: player.total_sl_hits,
    pnl_sol: player.total_pnl_sol,
    win_rate:
      player.total_attempts === 0
        ? 0
        : Math.round((player.total_wins / player.total_attempts) * 100)
  };

  return player;
}

function syncPlayerRank() {
  const nextRank = getRankFromXP(playerData.xp);
  const previousRankLevel = Number(playerData.rank_level) || 1;

  playerData.rank = nextRank.rank;
  playerData.rank_level = nextRank.rank_level;
  playerData.level = nextRank.rank_level;

  return nextRank.rank_level > previousRankLevel;
}

async function checkDailyBonus() {
  const today = todayString();
  const previousSessionDate = playerData.last_session_date;
  const currentRank = getRankFromXP(playerData.xp);
  let changed = false;

  if (previousSessionDate !== today && currentRank.rank_level >= 4) {
    playerData.xp += 25;
    changed = true;

    if (previousSessionDate === yesterdayString()) {
      playerData.coins += 10;
    }

    if (syncPlayerRank()) {
      showToast(`RANK UP: ${playerData.rank}`);
    } else {
      showToast('LOGIN BONUS +25 XP');
    }
  }

  const daysOff = daysDiff(previousSessionDate, today);

  if (daysOff > 3) {
    playerData.rusty = true;
    playerData.consecutive_days_off = daysOff;
    changed = true;
  }

  if (changed) {
    await window.electronAPI.savePlayer(playerData);
  }
}

async function applySessionRewards() {
  if (session.rewardsApplied || !playerData) {
    return;
  }

  session.rewardsApplied = true;

  const tradeRewards = session.trades.reduce(
    (totals, trade) => {
      const reward = calcTradeXP(trade.type, Number(trade.checked_count) || 0);

      return {
        xp: totals.xp + reward.xp,
        coins: totals.coins + reward.coins
      };
    },
    { xp: 0, coins: 0 }
  );
  const sessionRewards = calcSessionXP({
    wins: session.wins,
    attempts: session.attempts,
    passiveEvents: session.passiveEvents
  });
  const sessionMultiplier = session.isComeback ? 2 : 1;
  const earnedXP = (tradeRewards.xp + sessionRewards.xp) * sessionMultiplier;
  const earnedCoins = tradeRewards.coins + sessionRewards.coins;
  const sessionWon = session.attempts > 0 && session.wins / session.attempts > 0.5;

  // Quest completion checks will be attached in a later quest progression task.
  playerData.xp += earnedXP;
  playerData.coins += earnedCoins;
  playerData.total_sessions++;
  playerData.total_attempts += session.attempts;
  playerData.total_wins += session.wins;
  playerData.total_losses += session.losses;
  playerData.total_passive_events += session.passiveEvents;
  playerData.total_sl_hits += session.slHits;
  playerData.total_pnl_sol += session.pnl_sol;
  playerData.streak = sessionWon ? playerData.streak + 1 : 0;

  if (playerData.streak > playerData.best_streak) {
    playerData.best_streak = playerData.streak;
  }

  if (session.isComeback) {
    playerData.rusty = false;
    playerData.consecutive_days_off = 0;
  }

  playerData.last_session_date = todayString();
  playerData.stats = {
    ...(playerData.stats || {}),
    sessions: playerData.total_sessions,
    attempts: playerData.total_attempts,
    wins: playerData.total_wins,
    losses: playerData.total_losses,
    passive_events: playerData.total_passive_events,
    sl_hits: playerData.total_sl_hits,
    pnl_sol: playerData.total_pnl_sol,
    win_rate:
      playerData.total_attempts === 0
        ? 0
        : Math.round((playerData.total_wins / playerData.total_attempts) * 100)
  };

  if (syncPlayerRank()) {
    showToast(`RANK UP: ${playerData.rank}`);
  }

  await window.electronAPI.savePlayer(playerData);
}

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

function logTrade(type, pnlAmount = 0, checkedCount = 0) {
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
    pnl_amount: pnlAmount,
    checked_count: checkedCount
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
  const checkedCount = getCheckedCount();
  const pnlAmount = readPnlAmount();
  session.pnl_sol += pnlAmount;
  logTrade('ENTRY', pnlAmount, checkedCount);
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
  logTrade('PASS', 0, getCheckedCount());
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
  logTrade('SL', pnlAmount, getCheckedCount());
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
    isComeback: playerData.rusty === true,
    config: {
      lives: config.lives,
      sol_limit: config.solLimit
    }
  });

  sessionOver.hidden = true;
  summaryScreen.hidden = true;
  comebackBanner.hidden = !session.isComeback;
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
  await applySessionRewards();
}

function resetToStartScreen() {
  const windowPos = session.windowPos;
  Object.assign(session, createDefaultSession(), { windowPos });
  clearTimeout(passiveTimer);
  summaryScreen.hidden = true;
  sessionOver.hidden = true;
  comebackBanner.hidden = true;
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

  playerData = ensurePlayerShape(await window.electronAPI.loadPlayer());
  await checkDailyBonus();

  hudContainer.hidden = true;
  comebackBanner.hidden = true;
  startScreen.hidden = false;
  await window.electronAPI.resizeWindow(180);
  window.electronAPI.setIgnoreMouse(false);
  validateStartInputs();
  renderAll();
}

init();
