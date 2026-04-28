const PASSIVE_TIMEOUT = 5 * 60 * 1000;
const APP_VERSION = '0.18.0';
const RANK_TABLE = [
  { rank: 'Rookie', rank_level: 1, xp_required: 0, feature_unlock: 'basic_hud' },
  { rank: 'Scout', rank_level: 2, xp_required: 100, feature_unlock: 'session_history' },
  { rank: 'Operator', rank_level: 3, xp_required: 250, feature_unlock: 'quest_tracking' },
  { rank: 'Strategist', rank_level: 4, xp_required: 500, feature_unlock: 'boss_fights' },
  { rank: 'Specialist', rank_level: 5, xp_required: 900, feature_unlock: 'achievements' },
  { rank: 'Veteran', rank_level: 6, xp_required: 1400, feature_unlock: 'advanced_stats' },
  { rank: 'GIGACHAD', rank_level: 7, xp_required: 2200, feature_unlock: 'prestige' }
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
const BENCHMARK_WIN_RATE = 68.75;
const DEFAULT_WINDOW_WIDTH = 280;
const START_WINDOW_HEIGHT = 180;
const MINI_WINDOW_HEIGHT = 44;
const EXPANDED_WINDOW_HEIGHT = 460;
const LOCKED_WINDOW_HEIGHT = 320;
const SUMMARY_WINDOW_HEIGHT = 500;
const VAULT_WINDOW_HEIGHT = 500;
const DEFAULT_LIVES_SLOT_WIDTH = 72;
const HEART_SLOT_WIDTH = 21;
const LIVES_SLOT_PADDING = 14;
const MINI_BAR_SAFETY_WIDTH = 36;
const STREAK_SLOT_WIDTH = 26;
const DEFAULT_HEART_FULL = '\u2764\uFE0F';
let HEART_FULL = DEFAULT_HEART_FULL;
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
    recentResults: [],
    tilt_events: [],
    activeBossFight: null,
    bossDefeated: false,
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
let timerInterval = null;
let tiltCooldownUntil = 0;
let playerData = null;
let questDefs = null;
let questsState = null;
let opacitySaveTimer = null;
let activeVaultCategory = 'heart_skins';
const ipcCleanupCallbacks = [];

const startScreen = document.getElementById('start-screen');
const livesInput = document.getElementById('cfg-lives');
const solInput = document.getElementById('cfg-sol');
const startButton = document.getElementById('btn-start');
const hudContainer = document.getElementById('hud-container');
const miniBar = document.getElementById('mini-bar');
const expandedPanel = document.getElementById('expanded-panel');
const expandButton = document.getElementById('btn-expand');
const collapseButton = document.getElementById('btn-collapse');
const settingsButton = document.getElementById('btn-settings');
const settingsPanel = document.getElementById('settings-panel');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');
const vaultButton = document.getElementById('btn-vault');
const vaultPanel = document.getElementById('vault-panel');
const vaultCloseButton = document.getElementById('btn-vault-close');
const vaultTabs = document.getElementById('vault-tabs');
const vaultGrid = document.getElementById('vault-grid');
const historyButton = document.getElementById('btn-history');
const historyPanel = document.getElementById('history-panel');
const heatmapButton = document.getElementById('btn-heatmap');
const heatmapPanel = document.getElementById('heatmap-panel');
const entryButton = document.getElementById('btn-entry');
const passButton = document.getElementById('btn-pass');
const slButton = document.getElementById('btn-sl');
const endSessionButton = document.getElementById('btn-end-session');
const summaryScreen = document.getElementById('summary-screen');
const pnlInput = document.getElementById('pnl-input');
const pnlDisplay = document.getElementById('pnl-display');
const statsMini = document.querySelector('.stats-mini');
const streakDisplay = document.getElementById('streak-display');
const sessionTimer = document.getElementById('session-timer');
const tiltAlert = document.getElementById('tilt-alert');
const bossFightBanner = document.getElementById('boss-fight-banner');
const bossFightTitle = document.getElementById('boss-fight-title');
const bossFightDesc = document.getElementById('boss-fight-desc');
const bossTimer = document.getElementById('boss-timer');
const bossDefeatedToast = document.getElementById('boss-defeated-toast');
const statsCards = Array.from(document.querySelectorAll('.stats-grid > div'));
const checklistInputs = Array.from(document.querySelectorAll('.checklist input'));
const checklistKeys = ['chart', 'narrative', 'bubblemap', 'holders'];

const sessionOver = document.getElementById('session-over');
const loginBonusToast = document.getElementById('login-bonus-toast');
const shareToast = document.getElementById('share-toast');
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

function hasRankLevel(minLevel) {
  return playerData && Number(playerData.rank_level) >= minLevel;
}

function isGigachadRank() {
  return playerData && (String(playerData.rank).toUpperCase() === 'GIGACHAD' || playerData.rank_level >= 7);
}

function hasHeatmapRank() {
  if (!playerData) {
    return false;
  }

  const rankName = String(playerData.rank || '').toUpperCase();

  return rankName.includes('CHAD') || Number(playerData.rank_level) >= 6;
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

function showShareToast(message) {
  if (!shareToast) {
    return;
  }

  shareToast.textContent = message;
  shareToast.hidden = false;
  shareToast.classList.remove('toast-flash');
  void shareToast.offsetWidth;
  shareToast.classList.add('toast-flash');

  setTimeout(() => {
    shareToast.hidden = true;
  }, 3000);
}

function showTimedElement(element, className) {
  if (!element) {
    return;
  }

  element.hidden = false;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);

  setTimeout(() => {
    element.hidden = true;
  }, 3000);
}

function clampOpacity(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 100;
  }

  return Math.min(100, Math.max(25, Math.round(numericValue)));
}

function applyOpacity(value) {
  const clampedValue = clampOpacity(value);
  document.documentElement.style.setProperty('--hud-opacity', String(clampedValue / 100));

  if (opacitySlider) {
    opacitySlider.value = String(clampedValue);
  }

  if (opacityValue) {
    opacityValue.textContent = `${clampedValue}%`;
  }
}

function scheduleOpacitySave(value) {
  clearTimeout(opacitySaveTimer);

  opacitySaveTimer = setTimeout(async () => {
    if (!playerData) {
      return;
    }

    playerData.hud_opacity = clampOpacity(value);
    await window.electronAPI.savePlayer(playerData);
  }, 300);
}

function getLivesSlotWidth() {
  return Math.max(DEFAULT_LIVES_SLOT_WIDTH, session.maxLives * HEART_SLOT_WIDTH + LIVES_SLOT_PADDING);
}

function getResponsiveWindowWidth() {
  const livesOverflow = Math.max(0, getLivesSlotWidth() - DEFAULT_LIVES_SLOT_WIDTH);
  const streakWidth = playerData && playerData.rank_level >= 3 ? STREAK_SLOT_WIDTH : 0;

  return DEFAULT_WINDOW_WIDTH + livesOverflow + streakWidth + MINI_BAR_SAFETY_WIDTH;
}

function applyResponsiveLayout() {
  document.documentElement.style.setProperty('--lives-slot', `${getLivesSlotWidth()}px`);
}

function resizeHudWindow(height, width = getResponsiveWindowWidth()) {
  return window.electronAPI.resizeWindow(height, width);
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
  player.hud_opacity = clampOpacity(player.hud_opacity || 100);
  player.unlocked_heart_skins = Array.isArray(player.unlocked_heart_skins)
    ? player.unlocked_heart_skins
    : [];
  player.unlocked_borders = Array.isArray(player.unlocked_borders) ? player.unlocked_borders : [];
  player.unlocked_sound_packs = Array.isArray(player.unlocked_sound_packs)
    ? player.unlocked_sound_packs
    : [];
  player.unlocked_titles = Array.isArray(player.unlocked_titles) ? player.unlocked_titles : [];
  player.active_heart_skins = player.active_heart_skins || null;
  player.active_borders = player.active_borders || null;
  player.active_sound_packs = player.active_sound_packs || null;
  player.active_titles = player.active_titles || null;
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
    return {
      xpEarned: 0,
      coinsEarned: 0,
      questsCompleted: [],
      bossStatus: session.bossDefeated ? 'defeated' : 'none'
    };
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
  let earnedXP = (tradeRewards.xp + sessionRewards.xp) * sessionMultiplier;
  let earnedCoins = tradeRewards.coins + sessionRewards.coins;
  const sessionWon = session.attempts > 0 && session.wins / session.attempts > 0.5;

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

  const questsCompleted = completeEligibleQuests();
  const unlockedAchievements = questsCompleted.filter((quest) => quest.type === 'achievement');
  const questRewards = questsCompleted.reduce(
    (totals, quest) => ({
      xp: totals.xp + (Number(quest.xp) || 0),
      coins: totals.coins + (Number(quest.coins) || 0)
    }),
    { xp: 0, coins: 0 }
  );

  earnedXP += questRewards.xp;
  earnedCoins += questRewards.coins;
  playerData.xp += earnedXP;
  playerData.coins += earnedCoins;

  if (syncPlayerRank()) {
    showToast(`RANK UP: ${playerData.rank}`);
  }

  unlockedAchievements.forEach((achievement) => {
    showToast(`ACHIEVEMENT: ${achievement.name}`);
  });

  if (questsState) {
    await window.electronAPI.saveQuestsState(questsState);
  }

  await window.electronAPI.savePlayer(playerData);

  return {
    xpEarned: earnedXP,
    coinsEarned: earnedCoins,
    questsCompleted,
    bossStatus: session.bossDefeated ? 'defeated' : 'none'
  };
}

function ensureQuestStateShape(state) {
  state.completed = {
    mainline: Array.isArray(state.completed?.mainline) ? state.completed.mainline : [],
    side_quests: Array.isArray(state.completed?.side_quests) ? state.completed.side_quests : [],
    boss_fights: Array.isArray(state.completed?.boss_fights) ? state.completed.boss_fights : [],
    achievements: Array.isArray(state.completed?.achievements) ? state.completed.achievements : []
  };
  state.progress = {
    mainline: state.progress?.mainline || {},
    side_quests: state.progress?.side_quests || {},
    boss_fights: state.progress?.boss_fights || {},
    achievements: state.progress?.achievements || {}
  };
  state.rewards_claimed = {
    mainline: Array.isArray(state.rewards_claimed?.mainline)
      ? state.rewards_claimed.mainline
      : [],
    side_quests: Array.isArray(state.rewards_claimed?.side_quests)
      ? state.rewards_claimed.side_quests
      : [],
    boss_fights: Array.isArray(state.rewards_claimed?.boss_fights)
      ? state.rewards_claimed.boss_fights
      : [],
    achievements: Array.isArray(state.rewards_claimed?.achievements)
      ? state.rewards_claimed.achievements
      : []
  };
  state.boss_fight = {
    active: state.boss_fight?.active || state.active_boss_fight || null,
    last_triggered: state.boss_fight?.last_triggered || null
  };

  return state;
}

function getCosmetics() {
  return Array.isArray(questDefs?.cosmetics) ? questDefs.cosmetics : [];
}

function getCosmeticItem(itemId) {
  return getCosmetics().find((item) => item.id === itemId) || null;
}

function playSound(action, packId = playerData?.active_sound_packs) {
  if (!packId) {
    return;
  }

  const pack = getCosmeticItem(packId);
  const source = pack?.sounds?.[action];

  if (!source) {
    return;
  }

  new Audio(source).play().catch(() => {});
}

function getUnlockedKey(category) {
  return `unlocked_${category}`;
}

function getActiveKey(category) {
  return `active_${category}`;
}

function isCosmeticUnlocked(item) {
  return (playerData?.[getUnlockedKey(item.category)] || []).includes(item.id);
}

function applyCosmetics() {
  if (!playerData || !hudContainer) {
    return;
  }

  const activeHeart = getCosmeticItem(playerData.active_heart_skins);
  HEART_FULL = activeHeart?.preview || DEFAULT_HEART_FULL;

  hudContainer.classList.forEach((className) => {
    if (className.startsWith('cosmetic-border-')) {
      hudContainer.classList.remove(className);
    }
  });

  if (playerData.active_borders) {
    hudContainer.classList.add(`cosmetic-border-${playerData.active_borders}`);
  }

  renderHearts();
}

function renderVault(category = activeVaultCategory) {
  if (!vaultGrid || !vaultTabs || !playerData) {
    return;
  }

  activeVaultCategory = category;
  vaultTabs.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.category === activeVaultCategory);
  });

  const items = getCosmetics().filter((item) => item.category === activeVaultCategory);

  vaultGrid.innerHTML = items
    .map((item) => {
      const unlocked = isCosmeticUnlocked(item);
      const active = playerData[getActiveKey(item.category)] === item.id;
      const status = active ? 'ACTIVE' : unlocked ? 'OWNED' : `LOCKED - ${item.price} coins`;
      const actionLabel = active ? 'Active' : unlocked ? 'Equip' : 'Buy';
      const action = unlocked ? 'equip' : 'purchase';
      const disabled = active ? ' disabled' : '';
      const previewButton =
        item.category === 'sound_packs'
          ? `<button type="button" data-action="preview-sound" data-id="${item.id}" aria-label="Preview ${item.name}">▶</button>`
          : '';

      return `
        <div class="vault-item ${unlocked ? 'is-owned' : 'is-locked'} ${active ? 'is-active' : ''}">
          <div class="vault-preview">${item.preview || ''}</div>
          <div class="vault-name">${item.name}</div>
          <div class="vault-status">${status}</div>
          <div class="vault-actions">
            <button type="button" data-action="${action}" data-id="${item.id}"${disabled}>${actionLabel}</button>
            ${previewButton}
          </div>
        </div>
      `;
    })
    .join('');
}

async function onPurchaseItem(itemId) {
  const item = getCosmeticItem(itemId);

  if (!item || !playerData || isCosmeticUnlocked(item) || playerData.coins < item.price) {
    renderVault();
    return;
  }

  const unlockedKey = getUnlockedKey(item.category);
  playerData.coins -= item.price;
  playerData[unlockedKey] = [...(playerData[unlockedKey] || []), item.id];
  await window.electronAPI.savePlayer(playerData);
  renderVault(item.category);
}

async function onEquipItem(itemId) {
  const item = getCosmeticItem(itemId);

  if (!item || !playerData || !isCosmeticUnlocked(item)) {
    renderVault();
    return;
  }

  playerData[getActiveKey(item.category)] = item.id;
  applyCosmetics();
  await window.electronAPI.savePlayer(playerData);
  renderVault(item.category);
}

function setVaultVisible(visible) {
  if (!vaultPanel) {
    return;
  }

  vaultPanel.hidden = !visible;
  hudContainer.classList.toggle('is-vault', visible);

  if (visible) {
    heatmapPanel.hidden = true;
    historyPanel.hidden = true;
    renderVault();
    hudContainer.hidden = false;
    session.expanded = false;
    expandedPanel.hidden = true;
    miniBar.hidden = false;
    hudContainer.classList.remove('is-expanded', 'is-summary');
    resizeHudWindow(VAULT_WINDOW_HEIGHT);
  } else {
    const targetHeight = session.expanded
      ? EXPANDED_WINDOW_HEIGHT
      : session.startedAt
        ? MINI_WINDOW_HEIGHT
        : START_WINDOW_HEIGHT;
    resizeHudWindow(targetHeight, session.startedAt ? getResponsiveWindowWidth() : DEFAULT_WINDOW_WIDTH);
  }
}

function getHotColdState() {
  if (session.recentResults.length < 3) {
    return 'neutral';
  }

  if (session.recentResults.every((result) => result === 'win')) {
    return 'hot';
  }

  if (session.recentResults.every((result) => result === 'loss')) {
    return 'cold';
  }

  return 'neutral';
}

function renderHotCold() {
  const state = getHotColdState();

  hudContainer.classList.toggle('hot-border', state === 'hot');
  hudContainer.classList.toggle('cold-border', state === 'cold');
}

function renderStreak() {
  if (!streakDisplay || !playerData || playerData.rank_level < 3) {
    streakDisplay.hidden = true;
    return;
  }

  const streak = Number(playerData.streak) || 0;
  streakDisplay.hidden = false;
  streakDisplay.classList.toggle('streak-positive', streak > 0);
  streakDisplay.classList.toggle('streak-negative', streak < 0);

  if (streak > 0) {
    streakDisplay.textContent = `🔥${streak}`;
  } else if (streak < 0) {
    streakDisplay.textContent = String(streak);
  } else {
    streakDisplay.textContent = '—';
  }
}

function renderHeatmapButton() {
  if (!heatmapButton) {
    return;
  }

  const unlocked = hasHeatmapRank();
  heatmapButton.hidden = !unlocked;

  if (!unlocked && heatmapPanel) {
    heatmapPanel.hidden = true;
  }
}

function renderHistoryButton() {
  if (!historyButton) {
    return;
  }

  const unlocked = hasRankLevel(2);
  historyButton.hidden = !unlocked;

  if (!unlocked && historyPanel) {
    historyPanel.hidden = true;
  }
}

function interpolateHeatmapColor(winRate) {
  const red = [255, 51, 102];
  const green = [0, 255, 136];
  const ratio = Math.max(0, Math.min(1, Number(winRate) / 100));
  const color = red.map((channel, index) => {
    return Math.round(channel + (green[index] - channel) * ratio);
  });

  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function renderHeatmap(data) {
  if (!heatmapPanel) {
    return;
  }

  const buckets = Array.isArray(data) ? data : [];
  const maxTrades = Math.max(1, ...buckets.map((bucket) => Number(bucket.trades) || 0));

  heatmapPanel.innerHTML = '';

  Array.from({ length: 24 }, (_item, hour) => {
    const bucket = buckets.find((item) => Number(item.hour) === hour) || {
      hour,
      trades: 0,
      wins: 0,
      losses: 0,
      sl: 0,
      win_rate: 0
    };
    const trades = Number(bucket.trades) || 0;
    const winRate = Number(bucket.win_rate) || 0;
    const wins = Number(bucket.wins) || 0;
    const losses = Number(bucket.losses) || 0;
    const sl = Number(bucket.sl) || 0;
    const cell = document.createElement('div');

    cell.className = 'heatmap-cell';
    cell.textContent = `${hour}h`;
    cell.style.backgroundColor = interpolateHeatmapColor(winRate);
    cell.style.opacity = String(trades === 0 ? 0.18 : Math.min(1, 0.3 + (trades / maxTrades) * 0.7));
    cell.dataset.tooltip = `${trades} trades, W:${wins} L:${losses} SL:${sl}, ${winRate.toFixed(1)}% WR`;
    heatmapPanel.appendChild(cell);
  });
}

function formatHistoryDate(sessionData) {
  const rawDate = sessionData.ended_at || sessionData.started_at || sessionData.session_id || '';
  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return String(sessionData.session_id || '-').slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function renderHistoryRows(sessionRows) {
  if (!historyPanel) {
    return;
  }

  if (sessionRows.length === 0) {
    historyPanel.innerHTML = '<div class="history-empty">No saved sessions</div>';
    return;
  }

  historyPanel.innerHTML = sessionRows
    .map((sessionData) => {
      const summary = sessionData.summary || {};
      const wins = Number(summary.wins) || 0;
      const losses = Number(summary.losses) || 0;
      const winRate = Number(summary.win_rate) || 0;
      const pnl = Number(summary.pnl_sol) || 0;
      const pnlClass = pnl >= 0 ? 'pnl-positive' : 'pnl-negative';

      return `
        <div class="history-row">
          <span>${formatHistoryDate(sessionData)}</span>
          <span>W${wins} L${losses}</span>
          <span>${winRate.toFixed(1)}%</span>
          <strong class="${pnlClass}">${pnl.toFixed(3)} SOL</strong>
        </div>
      `;
    })
    .join('');
}

async function renderHistoryPanel() {
  if (!historyPanel) {
    return;
  }

  historyPanel.innerHTML = '<div class="history-empty">Loading...</div>';

  try {
    const sessionIds = await window.electronAPI.getSessionIds();
    const recentIds = [...sessionIds].sort().slice(-10).reverse();
    const sessionRows = await Promise.all(
      recentIds.map((id) => window.electronAPI.loadSession(id))
    );

    renderHistoryRows(sessionRows);
  } catch (error) {
    console.error('History load failed:', error);
    historyPanel.innerHTML = '<div class="history-empty">History unavailable</div>';
  }
}

function addIpcCleanup(cleanup) {
  if (typeof cleanup === 'function') {
    ipcCleanupCallbacks.push(cleanup);
  }
}

function updateRecentResults(result) {
  session.recentResults.push(result);

  if (session.recentResults.length > 3) {
    session.recentResults.shift();
  }
}

function updateSessionTimer() {
  if (!sessionTimer || !session.startedAt) {
    return;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
  );
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  sessionTimer.textContent = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
  hudContainer.classList.toggle('timer-warning', elapsedSeconds >= 7200);

  if (bossTimer) {
    bossTimer.textContent = sessionTimer.textContent;
  }
}

function stopSessionTimer() {
  clearInterval(timerInterval);
  timerInterval = null;

  if (sessionTimer) {
    sessionTimer.hidden = true;
  }

  hudContainer.classList.remove('timer-warning');
}

function clearTiltClasses() {
  hudContainer.classList.remove('tilt-yellow', 'tilt-blue', 'tilt-red');
}

function showTiltAlert(pattern, message, color) {
  const className = `tilt-${color}`;
  const now = Date.now();

  session.tilt_events.push({
    pattern,
    at: new Date(now).toISOString(),
    message
  });

  if (tiltAlert) {
    tiltAlert.textContent = message;
    tiltAlert.hidden = false;
  }

  clearTiltClasses();
  hudContainer.classList.add(className);

  if (pattern === 'C') {
    tiltCooldownUntil = now + 3 * 60 * 1000;
    checkEntryUnlock();
    setTimeout(() => {
      if (Date.now() >= tiltCooldownUntil) {
        tiltCooldownUntil = 0;
        tiltAlert.hidden = true;
        clearTiltClasses();
        checkEntryUnlock();
      }
    }, 3 * 60 * 1000);
  } else {
    setTimeout(() => {
      if (tiltAlert) {
        tiltAlert.hidden = true;
      }
      hudContainer.classList.remove(className);
    }, 3000);
  }

  autoSave();
}

function checkTiltPatterns() {
  if (!isGigachadRank()) {
    return;
  }

  const now = Date.now();
  const lastTenMinutes = session.trades.filter((trade) => {
    return now - new Date(trade.at).getTime() <= 10 * 60 * 1000;
  });
  const recentSLCount = lastTenMinutes.filter((trade) => trade.type === 'SL').length;

  if (recentSLCount >= 2) {
    showTiltAlert('A', 'SLOW DOWN', 'yellow');
  }

  const lastSLIndex = session.trades.map((trade) => trade.type).lastIndexOf('SL');

  if (lastSLIndex >= 0) {
    const afterLastSL = session.trades.slice(lastSLIndex + 1);
    const passStreakAfterSL =
      afterLastSL.length >= 3 && afterLastSL.slice(-3).every((trade) => trade.type === 'PASS');

    if (passStreakAfterSL) {
      showTiltAlert('B', 'SYSTEM CHECK', 'blue');
    }
  }
}

function checkPassiveTiltPattern() {
  if (!isGigachadRank()) {
    return;
  }

  const lastSL = [...session.trades].reverse().find((trade) => trade.type === 'SL');

  if (lastSL && Date.now() - new Date(lastSL.at).getTime() <= 2 * 60 * 1000) {
    showTiltAlert('C', 'TAKE A BREAK', 'red');
  }
}

function getBossMetric(metric) {
  const sessionWon = session.attempts > 0 && session.wins / session.attempts > 0.5;

  return {
    locked_sessions: session.locked ? 1 : 0,
    contained_red_sessions: !sessionWon && Math.abs(session.pnl_sol) <= (session.config.sol_limit || 0) ? 1 : 0,
    disciplined_session_streak: playerData?.streak || 0,
    attempts: session.attempts,
    wins: session.wins,
    losses: session.losses,
    sl_hits: session.slHits,
    passive_events: session.passiveEvents,
    pnl_sol: session.pnl_sol
  }[metric] ?? 0;
}

function isConditionMet(condition) {
  const actual = getBossMetric(condition.metric);

  if (condition.operator === '>=') {
    return actual >= condition.value;
  }

  if (condition.operator === '>') {
    return actual > condition.value;
  }

  if (condition.operator === '<=') {
    return actual <= condition.value;
  }

  if (condition.operator === '<') {
    return actual < condition.value;
  }

  return actual === condition.value;
}

async function checkAndTriggerBossFight() {
  if (!questDefs || !questsState || session.activeBossFight || session.trades.length !== 2) {
    return;
  }

  const today = todayString();

  if (questsState.boss_fight?.last_triggered === today || Math.random() >= 0.3) {
    return;
  }

  const bossFights = questDefs.boss_fights || [];
  const selected = bossFights[Math.floor(Math.random() * bossFights.length)];

  if (!selected) {
    return;
  }

  session.activeBossFight = selected;
  questsState.boss_fight = {
    active: selected.id,
    last_triggered: today
  };
  await window.electronAPI.saveQuestsState(questsState);
  renderBossFightBanner();
}

function renderBossFightBanner() {
  if (!bossFightBanner || !session.activeBossFight) {
    return;
  }

  bossFightTitle.textContent = session.activeBossFight.name;
  bossFightDesc.textContent = session.activeBossFight.desc;
  bossFightBanner.hidden = false;
  session.expanded = true;
  hudContainer.classList.add('is-expanded');
  expandedPanel.hidden = false;
  miniBar.hidden = true;
  resizeHudWindow(EXPANDED_WINDOW_HEIGHT);
  updateSessionTimer();
}

async function checkBossFightCondition() {
  if (!session.activeBossFight || !isConditionMet(session.activeBossFight.condition)) {
    return;
  }

  await onBossDefeated();
}

async function onBossDefeated() {
  const boss = session.activeBossFight;

  playerData.xp += Number(boss.xp) || 0;
  playerData.coins += Number(boss.coins) || 0;
  syncPlayerRank();
  session.bossDefeated = true;
  session.activeBossFight = null;
  questsState.boss_fight.active = null;

  if (bossFightBanner) {
    bossFightBanner.hidden = true;
  }

  showTimedElement(bossDefeatedToast, 'toast-flash');
  await window.electronAPI.savePlayer(playerData);
  await window.electronAPI.saveQuestsState(questsState);
}

async function handlePostAction() {
  renderAll();
  checkTiltPatterns();
  await checkAndTriggerBossFight();
  await checkBossFightCondition();
  await autoSave();
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
    tilt_events: session.tilt_events,
    active_boss_fight: session.activeBossFight ? session.activeBossFight.id : null,
    window_position: currentPosition()
  };
}

function getCompletedQuestIds(category) {
  return Array.isArray(questsState?.completed?.[category]) ? questsState.completed[category] : [];
}

function getClaimedQuestIds(category) {
  return Array.isArray(questsState?.rewards_claimed?.[category])
    ? questsState.rewards_claimed[category]
    : [];
}

function getQuestMetricValue(metric) {
  const metrics = {
    sessions_started: playerData?.total_sessions || 0,
    sessions_completed: playerData?.total_sessions || 0,
    sessions_saved: playerData?.total_sessions || 0,
    attempts: playerData?.total_attempts || 0,
    wins: playerData?.total_wins || 0,
    passes: session.trades.filter((trade) => trade.type === 'PASS').length,
    sl_hits: playerData?.total_sl_hits || 0,
    passive_events: playerData?.total_passive_events || 0,
    pnl_sol: playerData?.total_pnl_sol || 0,
    qualified_entries: session.trades.filter(
      (trade) => trade.type === 'ENTRY' && Number(trade.checked_count) >= 3
    ).length,
    entries_with_three_checks: session.trades.filter(
      (trade) => trade.type === 'ENTRY' && Number(trade.checked_count) === 3
    ).length,
    entries_with_four_checks: session.trades.filter(
      (trade) => trade.type === 'ENTRY' && Number(trade.checked_count) >= 4
    ).length,
    sessions_without_passive_alerts: session.passiveEvents === 0 ? 1 : 0,
    sessions_within_sol_limit:
      Math.abs(session.pnl_sol) <= Number(session.config.sol_limit || 0) ? 1 : 0,
    sessions_with_sol_limit_lte: Number(session.config.sol_limit) || 0,
    session_exports: session.endedAt ? 1 : 0,
    locked_sessions: session.locked ? 1 : 0,
    contained_red_sessions: getBossMetric('contained_red_sessions'),
    disciplined_session_streak: playerData?.streak || 0
  };

  return metrics[metric] ?? 0;
}

function isQuestConditionMet(condition) {
  const current = getQuestMetricValue(condition?.metric);
  const target = Number(condition?.value) || 0;
  const operator = condition?.operator || '>=';

  if (operator === '<=') {
    return current <= target;
  }

  if (operator === '>') {
    return current > target;
  }

  if (operator === '<') {
    return current < target;
  }

  if (operator === '===') {
    return current === target;
  }

  return current >= target;
}

function getQuestProgressValue(quest) {
  const current = getQuestMetricValue(quest.condition?.metric);
  const target = Number(quest.condition?.value) || 1;

  if (quest.condition?.operator === '<=') {
    return current;
  }

  return Math.min(target, current);
}

function completeEligibleQuests() {
  if (!questDefs || !questsState) {
    return [];
  }

  const groups = [
    { key: 'mainline', items: questDefs.mainline || [] },
    { key: 'side_quests', items: questDefs.side_quests || [] },
    { key: 'achievements', items: questDefs.achievements || [] }
  ];
  const completedNow = [];

  groups.forEach((group) => {
    const completed = getCompletedQuestIds(group.key);
    const claimed = getClaimedQuestIds(group.key);

    group.items.forEach((quest) => {
      const progressValue = getQuestMetricValue(quest.condition?.metric);
      const isCompleted = completed.includes(quest.id);
      const isClaimed = claimed.includes(quest.id);

      questsState.progress[group.key][quest.id] = progressValue;

      if (isCompleted) {
        if (!isClaimed) {
          claimed.push(quest.id);
          completedNow.push(quest);
        }
        return;
      }

      if (!isQuestConditionMet(quest.condition)) {
        return;
      }

      completed.push(quest.id);

      if (!isClaimed) {
        claimed.push(quest.id);
        completedNow.push(quest);
      }

      if (group.key === 'mainline' && Array.isArray(quest.unlock) && quest.unlock.length > 0) {
        questsState.active_mainline = quest.unlock[0];
      }
    });
  });

  return completedNow;
}

function getQuestProgressRows() {
  const groups = [
    { key: 'mainline', items: questDefs?.mainline || [] },
    { key: 'side_quests', items: questDefs?.side_quests || [] }
  ];
  const rows = [];

  groups.forEach((group) => {
    const completed = getCompletedQuestIds(group.key);

    group.items.slice(0, 3).forEach((quest) => {
      const target = Number(quest.condition?.value) || 1;
      const current = getQuestProgressValue(quest);
      const isComplete = completed.includes(quest.id) || isQuestConditionMet(quest.condition);

      rows.push({
        name: quest.name,
        status: isComplete ? 'COMPLETED' : `IN PROGRESS ${current}/${target}`,
        complete: isComplete
      });
    });
  });

  return rows.slice(0, 5);
}

function buildRecapHTML({ xpEarned, coinsEarned, questsCompleted, bossStatus }) {
  const winRate = session.attempts === 0 ? 0 : (session.wins / session.attempts) * 100;
  const benchmarkClass = winRate >= BENCHMARK_WIN_RATE ? 'recap-good' : 'recap-bad';
  const questRows = getQuestProgressRows();
  const questList =
    questRows.length > 0
      ? questRows
          .map((quest) => {
            const marker = quest.complete ? '&#10003;' : '-';
            return `<li class="${quest.complete ? 'is-complete' : ''}"><span>${marker} ${quest.name}</span><strong>${quest.status}</strong></li>`;
          })
          .join('')
      : '<li><span>- Quests</span><strong>IN PROGRESS 0/1</strong></li>';
  const bossCopy = bossStatus === 'defeated' ? '&#9876; DEFEATED' : '- no boss';
  const completedCopy =
    questsCompleted.length > 0 ? `${questsCompleted.length} completed` : 'tracking active';
  const achievements = questsCompleted.filter((quest) => quest.type === 'achievement');
  const achievementsHTML =
    achievements.length > 0
      ? `
    <div class="quest-recap">
      <div class="recap-subtitle">Achievements Unlocked</div>
      <ul>${achievements
        .map((achievement) => `<li class="is-complete"><span>&#10003; ${achievement.name}</span><strong>UNLOCKED</strong></li>`)
        .join('')}</ul>
    </div>`
      : '';

  return `
    <h3>Daily Recap</h3>
    <div class="recap-grid">
      <div><span>Session ID</span><strong>${session.id}</strong></div>
      <div><span>Win Rate</span><strong class="${benchmarkClass}">${winRate.toFixed(1)}%</strong><small>Benchmark ${BENCHMARK_WIN_RATE}%</small></div>
      <div><span>XP</span><strong class="recap-good">+${xpEarned}</strong></div>
      <div><span>Coins</span><strong class="recap-good">+${coinsEarned}</strong></div>
      <div><span>Streak</span><strong>${playerData?.streak || 0}</strong></div>
      <div><span>Boss</span><strong>${bossCopy}</strong></div>
    </div>
    <div class="quest-recap">
      <div class="recap-subtitle">Quest Progress <span>${completedCopy}</span></div>
      <ul>${questList}</ul>
    </div>
    ${achievementsHTML}
    <div class="summary-actions">
      <button id="btn-share" type="button">Share</button>
      <button id="btn-new-session" type="button">New Session</button>
    </div>
  `;
}

function getShareQuestLabel(rewardsData) {
  const completedQuest = rewardsData?.questsCompleted?.[0];

  if (typeof completedQuest === 'string') {
    return completedQuest;
  }

  if (completedQuest?.name) {
    return completedQuest.name;
  }

  const completedProgress = getQuestProgressRows().find((quest) => quest.complete);

  return completedProgress?.name || 'Quest tracking';
}

function drawShareText(ctx, text, x, y, options = {}) {
  ctx.fillStyle = options.color || '#effff7';
  ctx.font = options.font || '16px Segoe UI';
  ctx.textAlign = options.align || 'left';
  ctx.fillText(text, x, y);
}

function generateShareCard(sessionData, player, rewardsData) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 340;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context unavailable');
  }

  const winRate = Number(sessionData.summary?.win_rate) || 0;
  const isGoodRate = winRate >= BENCHMARK_WIN_RATE;
  const accent = '#00ff88';
  const danger = '#ff3366';
  const panel = '#11111d';
  const muted = 'rgba(239,255,247,0.62)';
  const sessionDate = sessionData.ended_at || sessionData.started_at || new Date().toISOString();

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, 600, 340);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0,255,136,0.4)';
  ctx.shadowBlur = 12;
  ctx.strokeRect(12, 12, 576, 316);
  ctx.shadowBlur = 0;

  [
    [32, 54, 150, 210],
    [206, 54, 188, 210],
    [418, 54, 150, 210]
  ].forEach(([x, y, width, height]) => {
    ctx.fillStyle = panel;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = 'rgba(0,255,136,0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  });

  drawShareText(ctx, 'SESSION', 50, 84, { color: muted, font: '11px Segoe UI' });
  drawShareText(ctx, sessionData.session_id || '-', 50, 112, {
    color: accent,
    font: '18px Segoe UI Semibold'
  });
  drawShareText(ctx, new Date(sessionDate).toLocaleDateString(), 50, 148, {
    color: muted,
    font: '13px Segoe UI'
  });
  drawShareText(ctx, `Rank: ${player?.rank || 'Rookie'}`, 50, 188, {
    color: '#effff7',
    font: '15px Segoe UI Semibold'
  });
  drawShareText(ctx, `Streak: ${Number(player?.streak) || 0}`, 50, 224, {
    color: muted,
    font: '13px Segoe UI'
  });

  drawShareText(ctx, 'WIN RATE', 300, 92, { color: muted, font: '12px Segoe UI', align: 'center' });
  drawShareText(ctx, `${winRate.toFixed(1)}%`, 300, 158, {
    color: isGoodRate ? accent : danger,
    font: '52px Segoe UI Semibold',
    align: 'center'
  });
  drawShareText(ctx, `Benchmark ${BENCHMARK_WIN_RATE}%`, 300, 190, {
    color: muted,
    font: '12px Segoe UI',
    align: 'center'
  });
  drawShareText(ctx, `Attempts ${sessionData.summary?.attempts || 0}`, 246, 232, {
    color: '#effff7',
    font: '15px Segoe UI Semibold'
  });
  drawShareText(ctx, `Wins ${sessionData.summary?.wins || 0}`, 326, 232, {
    color: '#effff7',
    font: '15px Segoe UI Semibold'
  });

  drawShareText(ctx, 'REWARDS', 436, 84, { color: muted, font: '11px Segoe UI' });
  drawShareText(ctx, `XP +${rewardsData?.xpEarned || 0}`, 436, 124, {
    color: accent,
    font: '24px Segoe UI Semibold'
  });
  drawShareText(ctx, `Coins +${rewardsData?.coinsEarned || 0}`, 436, 166, {
    color: accent,
    font: '22px Segoe UI Semibold'
  });
  drawShareText(ctx, 'Quest', 436, 208, { color: muted, font: '12px Segoe UI' });
  drawShareText(ctx, getShareQuestLabel(rewardsData), 436, 234, {
    color: '#effff7',
    font: '14px Segoe UI Semibold'
  });

  ctx.fillStyle = 'rgba(0,255,136,0.08)';
  ctx.fillRect(32, 286, 536, 24);
  drawShareText(ctx, 'SOL TRADER HUD', 48, 303, {
    color: accent,
    font: '13px Segoe UI Semibold'
  });
  drawShareText(ctx, `v${APP_VERSION}`, 552, 303, {
    color: muted,
    font: '12px Segoe UI',
    align: 'right'
  });

  return canvas.toDataURL('image/png').split(',')[1];
}

async function handleShareCard(rewardsData) {
  try {
    const sessionData = buildSessionJSON();
    const base64 = generateShareCard(sessionData, playerData, rewardsData);
    await window.electronAPI.saveShareCard({
      base64,
      session_id: sessionData.session_id
    });
    showShareToast('Card saved!');
  } catch (error) {
    console.error('Share card export failed:', error);
    showShareToast('Export failed');
  }
}

function bindRecapActions(rewardsData) {
  const shareButton = document.getElementById('btn-share');
  const newSessionButton = document.getElementById('btn-new-session');

  if (shareButton) {
    shareButton.addEventListener('click', () => {
      handleShareCard(rewardsData);
    });
  }

  if (newSessionButton) {
    newSessionButton.addEventListener('click', resetToStartScreen);
  }
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
  applyResponsiveLayout();

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
  statsMini.textContent = `W${session.wins} L${session.losses} ${winRate}%`;

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
  const tiltLocked = Date.now() < tiltCooldownUntil;

  entryButton.disabled = session.locked || tiltLocked || checkedCount < 3;
  passButton.disabled = session.locked || tiltLocked;
  slButton.disabled = session.locked || tiltLocked;
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
  resizeHudWindow(LOCKED_WINDOW_HEIGHT);
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
    checkPassiveTiltPattern();
    autoSave();
  }, PASSIVE_TIMEOUT);
}

function renderAll() {
  renderHearts();
  renderStats();
  renderPnL();
  renderChecklist();
  renderHotCold();
  renderStreak();
  renderHeatmapButton();
  renderHistoryButton();

  if (session.locked) {
    lockSession();
  }
}

async function onEntry() {
  if (session.locked || !session.startedAt || Date.now() < tiltCooldownUntil) {
    return;
  }

  session.attempts++;
  session.wins++;
  const checkedCount = getCheckedCount();
  const pnlAmount = readPnlAmount();
  session.pnl_sol += pnlAmount;
  logTrade('ENTRY', pnlAmount, checkedCount);
  updateRecentResults('win');
  playSound('entry');
  pnlInput.value = '';
  resetChecklist();
  resetPassiveTimer();
  await handlePostAction();
}

async function onPass() {
  if (session.locked || !session.startedAt || Date.now() < tiltCooldownUntil) {
    return;
  }

  session.attempts++;
  session.losses++;
  logTrade('PASS', 0, getCheckedCount());
  updateRecentResults('loss');
  playSound('pass');
  resetChecklist();
  resetPassiveTimer();
  await handlePostAction();
}

async function onSL() {
  if (session.locked || !session.startedAt || Date.now() < tiltCooldownUntil) {
    return;
  }

  session.lives--;
  session.slHits++;
  session.attempts++;
  session.losses++;
  const pnlAmount = readPnlAmount();
  session.pnl_sol -= pnlAmount;
  logTrade('SL', pnlAmount, getCheckedCount());
  updateRecentResults('loss');
  playSound('sl');
  pnlInput.value = '';
  resetChecklist();
  resetPassiveTimer();

  if (session.lives <= 0) {
    session.lives = 0;
    lockSession();
  }

  await handlePostAction();
}

expandButton.addEventListener('click', () => {
  if (!session.startedAt) {
    return;
  }

  setVaultVisible(false);
  session.expanded = true;
  hudContainer.classList.add('is-expanded');
  expandedPanel.hidden = false;
  miniBar.hidden = true;
  resizeHudWindow(EXPANDED_WINDOW_HEIGHT);
  window.electronAPI.setIgnoreMouse(false);
});

collapseButton.addEventListener('click', () => {
  if (!session.startedAt) {
    return;
  }

  session.expanded = false;
  settingsPanel.hidden = true;
  heatmapPanel.hidden = true;
  historyPanel.hidden = true;
  hudContainer.classList.remove('is-expanded');
  expandedPanel.hidden = true;
  miniBar.hidden = false;
  resizeHudWindow(MINI_WINDOW_HEIGHT);
  window.electronAPI.setIgnoreMouse(false);
});

settingsButton.addEventListener('click', () => {
  if (!session.startedAt) {
    return;
  }

  setVaultVisible(false);
  heatmapPanel.hidden = true;
  historyPanel.hidden = true;
  settingsPanel.hidden = !settingsPanel.hidden;
  session.expanded = true;
  hudContainer.classList.add('is-expanded');
  expandedPanel.hidden = false;
  miniBar.hidden = true;
  resizeHudWindow(settingsPanel.hidden ? EXPANDED_WINDOW_HEIGHT : VAULT_WINDOW_HEIGHT);
});

heatmapButton.addEventListener('click', async () => {
  if (!session.startedAt || !hasHeatmapRank()) {
    return;
  }

  setVaultVisible(false);
  settingsPanel.hidden = true;
  historyPanel.hidden = true;
  session.expanded = true;
  hudContainer.classList.add('is-expanded');
  expandedPanel.hidden = false;
  miniBar.hidden = true;

  if (heatmapPanel.hidden) {
    try {
      renderHeatmap(await window.electronAPI.loadHeatmapData());
      heatmapPanel.hidden = false;
    } catch (error) {
      console.error('Heatmap load failed:', error);
      renderHeatmap([]);
      heatmapPanel.hidden = false;
    }
  } else {
    heatmapPanel.hidden = true;
  }

  resizeHudWindow(EXPANDED_WINDOW_HEIGHT);
});

historyButton.addEventListener('click', async () => {
  if (!session.startedAt || !hasRankLevel(2)) {
    return;
  }

  setVaultVisible(false);
  settingsPanel.hidden = true;
  heatmapPanel.hidden = true;
  session.expanded = true;
  hudContainer.classList.add('is-expanded');
  expandedPanel.hidden = false;
  miniBar.hidden = true;

  if (historyPanel.hidden) {
    historyPanel.hidden = false;
    await renderHistoryPanel();
  } else {
    historyPanel.hidden = true;
  }

  resizeHudWindow(EXPANDED_WINDOW_HEIGHT);
});

opacitySlider.addEventListener('input', () => {
  const value = clampOpacity(opacitySlider.value);
  applyOpacity(value);
  scheduleOpacitySave(value);
});

vaultButton.addEventListener('click', () => {
  if (!playerData) {
    return;
  }

  setVaultVisible(vaultPanel.hidden);
});

vaultCloseButton.addEventListener('click', () => {
  setVaultVisible(false);
});

vaultTabs.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-category]');

  if (button) {
    renderVault(button.dataset.category);
  }
});

vaultGrid.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');

  if (!button) {
    return;
  }

  if (button.dataset.action === 'purchase') {
    await onPurchaseItem(button.dataset.id);
  } else if (button.dataset.action === 'preview-sound') {
    playSound('entry', button.dataset.id);
  } else {
    await onEquipItem(button.dataset.id);
  }
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
  await resizeHudWindow(session.expanded ? EXPANDED_WINDOW_HEIGHT : MINI_WINDOW_HEIGHT);
  window.electronAPI.setIgnoreMouse(false);
});

document.addEventListener('mousemove', (e) => {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const inInteractiveArea = el && el.closest('#hud-container, #start-screen');
  window.electronAPI.setIgnoreMouse(!inInteractiveArea);
});

addIpcCleanup(
  window.electronAPI.onWindowPositionChanged((pos) => {
    session.windowPos = pos;
  })
);

window.addEventListener('beforeunload', () => {
  ipcCleanupCallbacks.splice(0).forEach((cleanup) => cleanup());
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
    activeBossFight: null,
    config: {
      lives: config.lives,
      sol_limit: config.solLimit
    }
  });
  applyResponsiveLayout();

  sessionOver.hidden = true;
  summaryScreen.hidden = true;
  summaryScreen.innerHTML = '';
  settingsPanel.hidden = true;
  heatmapPanel.hidden = true;
  historyPanel.hidden = true;
  vaultPanel.hidden = true;
  comebackBanner.hidden = !session.isComeback;
  bossFightBanner.hidden = true;
  bossDefeatedToast.hidden = true;
  tiltAlert.hidden = true;
  endSessionButton.hidden = false;
  hudContainer.classList.remove(
    'is-expanded',
    'is-locked',
    'is-summary',
    'is-vault',
    'passive-alert',
    'hot-border',
    'cold-border',
    'timer-warning',
    'tilt-yellow',
    'tilt-blue',
    'tilt-red'
  );
  session.expanded = session.isComeback;
  hudContainer.classList.toggle('is-expanded', session.expanded);
  expandedPanel.hidden = !session.expanded;
  miniBar.hidden = session.expanded;
  tiltCooldownUntil = 0;
  stopSessionTimer();

  if (hasRankLevel(2)) {
    sessionTimer.hidden = false;
    updateSessionTimer();
    timerInterval = setInterval(updateSessionTimer, 1000);
  }

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
  stopSessionTimer();
  renderAll();
  await autoSave();
  const sessionRewards = await applySessionRewards();
  summaryScreen.innerHTML = buildRecapHTML(sessionRewards);
  bindRecapActions(sessionRewards);

  summaryScreen.hidden = false;
  sessionOver.hidden = true;
  bossFightBanner.hidden = true;
  settingsPanel.hidden = true;
  heatmapPanel.hidden = true;
  historyPanel.hidden = true;
  setVaultVisible(false);
  endSessionButton.hidden = true;
  session.expanded = true;
  hudContainer.classList.add('is-expanded', 'is-summary');
  hudContainer.classList.remove('is-locked');
  expandedPanel.hidden = false;
  miniBar.hidden = true;
  resizeHudWindow(SUMMARY_WINDOW_HEIGHT);
}

function resetToStartScreen() {
  const windowPos = session.windowPos;
  Object.assign(session, createDefaultSession(), { windowPos });
  applyResponsiveLayout();
  clearTimeout(passiveTimer);
  stopSessionTimer();
  clearTimeout(opacitySaveTimer);
  summaryScreen.hidden = true;
  sessionOver.hidden = true;
  comebackBanner.hidden = true;
  bossFightBanner.hidden = true;
  settingsPanel.hidden = true;
  heatmapPanel.hidden = true;
  historyPanel.hidden = true;
  vaultPanel.hidden = true;
  bossDefeatedToast.hidden = true;
  shareToast.hidden = true;
  tiltAlert.hidden = true;
  endSessionButton.hidden = false;
  hudContainer.hidden = true;
  hudContainer.classList.remove(
    'is-expanded',
    'is-locked',
    'is-summary',
    'is-vault',
    'passive-alert',
    'hot-border',
    'cold-border',
    'timer-warning',
    'tilt-yellow',
    'tilt-blue',
    'tilt-red'
  );
  expandedPanel.hidden = true;
  miniBar.hidden = false;
  startScreen.hidden = false;
  startButton.disabled = false;
  resizeHudWindow(START_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH);
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
  questDefs = await window.electronAPI.loadQuestDefs();
  questsState = ensureQuestStateShape(await window.electronAPI.loadQuestsState());
  applyOpacity(playerData.hud_opacity);
  applyCosmetics();
  await checkDailyBonus();

  hudContainer.hidden = true;
  vaultPanel.hidden = true;
  settingsPanel.hidden = true;
  heatmapPanel.hidden = true;
  historyPanel.hidden = true;
  comebackBanner.hidden = true;
  bossFightBanner.hidden = true;
  bossDefeatedToast.hidden = true;
  tiltAlert.hidden = true;
  sessionTimer.hidden = true;
  startScreen.hidden = false;
  await resizeHudWindow(START_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH);
  window.electronAPI.setIgnoreMouse(false);
  addIpcCleanup(
    window.electronAPI.onKbEntry(() => {
      if (session.startedAt && !session.locked) {
        onEntry();
      }
    })
  );
  addIpcCleanup(
    window.electronAPI.onKbPass(() => {
      if (session.startedAt && !session.locked) {
        onPass();
      }
    })
  );
  addIpcCleanup(
    window.electronAPI.onKbSl(() => {
      if (session.startedAt && !session.locked) {
        onSL();
      }
    })
  );
  validateStartInputs();
  renderAll();
}

init();
