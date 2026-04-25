const fs = require('fs');
const path = require('path');

const playerFile = path.join(__dirname, '..', 'sessions', 'player.json');

function getNow() {
  return new Date().toISOString();
}

function ensureSessionsDir() {
  fs.mkdirSync(path.dirname(playerFile), { recursive: true });
}

function writePlayer(player) {
  ensureSessionsDir();
  fs.writeFileSync(playerFile, JSON.stringify(player, null, 2));
}

function getDefaultPlayer() {
  const now = getNow();

  return {
    id: 'default',
    name: 'Player',
    level: 1,
    xp: 0,
    rank: 'rookie',
    streak: {
      current: 0,
      best: 0
    },
    stats: {
      sessions: 0,
      attempts: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      passive_events: 0,
      sl_hits: 0,
      pnl_sol: 0
    },
    achievements: [],
    settings: {
      lives: 3,
      sol_limit: 0.15
    },
    created_at: now,
    updated_at: now
  };
}

function savePlayer(data) {
  const player = {
    ...data,
    updated_at: getNow()
  };

  writePlayer(player);

  return player;
}

function loadPlayer() {
  try {
    const player = JSON.parse(fs.readFileSync(playerFile, 'utf8'));

    return savePlayer(player);
  } catch {
    const player = getDefaultPlayer();
    writePlayer(player);

    return player;
  }
}

module.exports = {
  getDefaultPlayer,
  loadPlayer,
  savePlayer
};
