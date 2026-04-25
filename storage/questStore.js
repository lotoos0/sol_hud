const fs = require('fs');
const path = require('path');

const questsStateFile = path.join(__dirname, '..', 'sessions', 'quests_state.json');
const questDefsFile = path.join(__dirname, '..', 'data', 'quests_definitions.json');

function getNow() {
  return new Date().toISOString();
}

function ensureSessionsDir() {
  fs.mkdirSync(path.dirname(questsStateFile), { recursive: true });
}

function writeQuestsState(questsState) {
  ensureSessionsDir();
  fs.writeFileSync(questsStateFile, JSON.stringify(questsState, null, 2));
}

function getDefaultQuestsState() {
  const now = getNow();

  return {
    schema_version: 1,
    active_mainline: null,
    active_side_quests: [],
    active_boss_fight: null,
    completed: {
      mainline: [],
      side_quests: [],
      boss_fights: [],
      achievements: []
    },
    progress: {
      mainline: {},
      side_quests: {},
      boss_fights: {},
      achievements: {}
    },
    rewards_claimed: {
      mainline: [],
      side_quests: [],
      boss_fights: [],
      achievements: []
    },
    created_at: now,
    updated_at: now
  };
}

function loadQuestsState() {
  try {
    return JSON.parse(fs.readFileSync(questsStateFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    const questsState = getDefaultQuestsState();
    writeQuestsState(questsState);

    return questsState;
  }
}

function saveQuestsState(data) {
  const questsState = {
    ...data,
    updated_at: getNow()
  };

  writeQuestsState(questsState);

  return questsState;
}

function loadQuestDefs() {
  const defs = JSON.parse(fs.readFileSync(questDefsFile, 'utf8'));

  return {
    mainline: defs.mainline,
    side_quests: defs.side_quests,
    boss_fights: defs.boss_fights,
    achievements: defs.achievements
  };
}

module.exports = {
  getDefaultQuestsState,
  loadQuestsState,
  saveQuestsState,
  loadQuestDefs
};
