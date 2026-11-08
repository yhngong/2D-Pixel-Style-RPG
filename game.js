/**
 * VALORIA: 2.5D PIXEL RPG (ZERO-EMOJI PIXEL SPRITE EDITION)
 * Features:
 * - 100% Real Pixel Art Sprites via SpriteEngine (sprites.js) — zero emoji sprites!
 * - Grounded 2.5D shadows directly underneath Player, NPC, Monster, and Tree feet (no floating!)
 * - Massive 160x160 World (25,600 tiles) across 7 Biomes + Live Radar Minimap + Teleport Recall [T]
 * - Oakhaven Village with 4 Interactive Shops (Armory, Alchemist/Miner, Bone Relic Trader, and +50 Master Blacksmith)
 * - 6 Rarity Tiers (Common, Uncommon, Rare, Epic, Legendary, Mythic) with Level Requirements & Full-Set Bonuses
 * - Active Combat Skills: Dash [Shift], 360° Whirlwind Slash [Q], Sword Energy Waves on Epic/Legendary/Mythic Blades
 * - 14 Monster Species + 4 Giant World Bosses with Boss Health Bar HUD, Bone drops, Gold, and Tier 1-6 Loot Chests
 * - Pickaxe Mining (10 Block/Ore types) & 2.5D Block Placement + WebAudio Retro Chiptune Sound Effects
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const miniCanvas = document.getElementById('minimap-canvas');
const miniCtx = miniCanvas.getContext('2d');

// ==========================================
// 0. RETRO CHIPTUNE SFX SYNTHESIZER (WebAudio)
// ==========================================
const SoundFX = (() => {
  let audioCtx = null;
  let enabled = true;

  function init() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, vol = 0.08, slideFreq = null) {
    if (!enabled) return;
    init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideFreq, now + duration);
    }
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  return {
    toggle() {
      enabled = !enabled;
      return enabled;
    },
    swing() { playTone(260, 'triangle', 0.11, 0.07, 110); },
    hit() { playTone(150, 'sawtooth', 0.09, 0.08, 65); },
    crit() {
      playTone(420, 'square', 0.08, 0.09, 680);
      setTimeout(() => playTone(680, 'square', 0.12, 0.08, 920), 50);
    },
    mine() { playTone(320, 'square', 0.06, 0.06, 190); },
    place() { playTone(180, 'triangle', 0.08, 0.07, 290); },
    coin() {
      playTone(587, 'sine', 0.07, 0.07);
      setTimeout(() => playTone(880, 'sine', 0.14, 0.07), 55);
    },
    chest() {
      [440, 554, 659, 880].forEach((f, idx) => {
        setTimeout(() => playTone(f, 'triangle', 0.14, 0.09), idx * 75);
      });
    },
    levelUp() {
      [523, 659, 784, 1046].forEach((f, idx) => {
        setTimeout(() => playTone(f, 'square', 0.16, 0.08), idx * 85);
      });
    },
    dash() { playTone(380, 'sine', 0.14, 0.06, 140); },
    whirlwind() { playTone(220, 'sawtooth', 0.25, 0.08, 520); }
  };
})();

// ==========================================
// 1. RARITY TIERS & FULL SET BONUSES
// ==========================================
const RARITIES = {
  common: {
    id: 'common',
    name: 'Common',
    color: '#c4c9d4',
    darkColor: '#64748b',
    levelReq: 1,
    setName: 'Militia Ironclad Set',
    setBonusDesc: '+25 Max HP, +4 Defense',
    setBonus: { maxHp: 25, def: 4, atk: 0, atkMult: 0, speedMult: 0, critChance: 0, regen: 0, lifesteal: 0 }
  },
  uncommon: {
    id: 'uncommon',
    name: 'Uncommon',
    color: '#4ade80',
    darkColor: '#16a34a',
    levelReq: 3,
    setName: 'Ranger Vanguard Set',
    setBonusDesc: '+55 Max HP, +12% Move Speed, +6 Attack',
    setBonus: { maxHp: 55, def: 6, atk: 6, atkMult: 0, speedMult: 0.12, critChance: 0.05, regen: 2, lifesteal: 0 }
  },
  rare: {
    id: 'rare',
    name: 'Rare',
    color: '#38bdf8',
    darkColor: '#0284c7',
    levelReq: 6,
    setName: 'Cobalt Knight Set',
    setBonusDesc: '+110 Max HP, +18% Attack Damage, +5 HP/s Regen',
    setBonus: { maxHp: 110, def: 12, atk: 12, atkMult: 0.18, speedMult: 0.15, critChance: 0.10, regen: 5, lifesteal: 0 }
  },
  epic: {
    id: 'epic',
    name: 'Epic',
    color: '#c084fc',
    darkColor: '#7e22ce',
    levelReq: 10,
    setName: 'Voidwalker Warlord Set',
    setBonusDesc: '+220 Max HP, +28% Damage, +20% Crit Chance, 12% Lifesteal',
    setBonus: { maxHp: 220, def: 24, atk: 26, atkMult: 0.28, speedMult: 0.20, critChance: 0.20, regen: 9, lifesteal: 0.12 }
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    color: '#fbbf24',
    darkColor: '#d97706',
    levelReq: 15,
    setName: 'Sunforged Paladin Set',
    setBonusDesc: '+420 Max HP, +45% Damage, +30% Crit Chance, +20 HP/s Regen & Golden Wings',
    setBonus: { maxHp: 420, def: 44, atk: 52, atkMult: 0.45, speedMult: 0.26, critChance: 0.30, regen: 20, lifesteal: 0.16, wings: '#fbbf24' }
  },
  mythic: {
    id: 'mythic',
    name: 'Mythic',
    color: '#ff3e6c',
    darkColor: '#be123c',
    levelReq: 20,
    setName: 'Celestial Dragonlord Set',
    setBonusDesc: '+850 Max HP, +80% Damage, +40% Crit, 25% Lifesteal & Celestial Wings!',
    setBonus: { maxHp: 850, def: 85, atk: 110, atkMult: 0.80, speedMult: 0.36, critChance: 0.40, regen: 38, lifesteal: 0.25, wings: '#ff3e6c' }
  }
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// ==========================================
// 2. EXPANDED ITEM CATALOG (With Real Pixel Art Icons!)
// ==========================================
const ITEM_DB = {};

function getItemIconHtml(item, size = 24) {
  if (!item) return '';
  const r = RARITIES[item.rarity] || RARITIES.common;
  if (item.type === 'weapon') {
    const kind = item.id.includes('axe') || item.id.includes('claymore') || item.id.includes('halberd') || item.id.includes('reaver') || item.id.includes('hammer') || item.id.includes('scythe') ? 'greatsword' : 'sword';
    return SpriteEngine.getIconHtml(kind, item.bladeColor || r.color, '#fbbf24', size);
  }
  if (item.type === 'tool') {
    return SpriteEngine.getIconHtml('pickaxe', item.headColor || r.color, '#a16207', size);
  }
  if (item.type === 'armor') {
    return SpriteEngine.getIconHtml(item.slot, r.color, r.darkColor, size);
  }
  if (item.type === 'consumable') {
    const pColor = item.buffType === 'berserk' ? '#f97316' : r.color;
    return SpriteEngine.getIconHtml('potion', pColor, '#ffffff', size);
  }
  if (item.type === 'chest') {
    return SpriteEngine.getIconHtml('chest', r.color, '#fbbf24', size);
  }
  if (item.type === 'block') {
    return SpriteEngine.getIconHtml('block', item.topColor, item.sideColor, size);
  }
  return SpriteEngine.getIconHtml('sword', r.color, '#fbbf24', size);
}

function registerItem(item) {
  item.icon = getItemIconHtml(item, 24);
  ITEM_DB[item.id] = item;
}

// 12 Weapons across all 6 rarities
const WEAPON_TEMPLATES = [
  { rarity: 'common', id: 'sword_common', name: 'Rusty Shortsword', atk: 8, price: 25, bladeColor: '#cbd5e1' },
  { rarity: 'common', id: 'axe_common', name: 'Militia Broadsword', atk: 12, price: 45, bladeColor: '#94a3b8' },
  { rarity: 'uncommon', id: 'sword_uncommon', name: 'Emerald Gladius', atk: 20, price: 105, bladeColor: '#4ade80' },
  { rarity: 'uncommon', id: 'claymore_uncommon', name: 'Forest Claymore', atk: 28, price: 175, bladeColor: '#22c55e' },
  { rarity: 'rare', id: 'sword_rare', name: 'Cobalt Katana', atk: 45, price: 360, bladeColor: '#38bdf8' },
  { rarity: 'rare', id: 'halberd_rare', name: 'Glacier Greatsword', atk: 60, price: 540, bladeColor: '#0ea5e9' },
  { rarity: 'epic', id: 'sword_epic', name: 'Obsidian Voidblade', atk: 96, price: 1200, bladeColor: '#c084fc', projectileColor: '#c084fc' },
  { rarity: 'epic', id: 'reaver_epic', name: 'Soulreaver Scythe', atk: 125, price: 1700, bladeColor: '#a855f7', projectileColor: '#a855f7' },
  { rarity: 'legendary', id: 'sword_legendary', name: 'Solaris Excalibur', atk: 210, price: 4000, bladeColor: '#fbbf24', projectileColor: '#fbbf24' },
  { rarity: 'legendary', id: 'hammer_legendary', name: 'Dragonbane Warhammer', atk: 265, price: 5500, bladeColor: '#f59e0b', projectileColor: '#f59e0b' },
  { rarity: 'mythic', id: 'sword_mythic', name: 'Astral Godslayer', atk: 420, price: 12000, bladeColor: '#ff3e6c', projectileColor: '#ff3e6c' },
  { rarity: 'mythic', id: 'scythe_mythic', name: 'Celestial Starbreaker', atk: 550, price: 18500, bladeColor: '#f43f5e', projectileColor: '#fde047' }
];

WEAPON_TEMPLATES.forEach(w => {
  registerItem({
    ...w,
    type: 'weapon',
    slot: 'weapon',
    levelReq: 1,
    desc: `A ${RARITIES[w.rarity].name} weapon granting +${w.atk} Attack Power.${w.projectileColor ? ' Fires piercing energy waves on every swing!' : ''}`
  });
});

// Pickaxes across all 6 rarities
const PICKAXE_TEMPLATES = [
  { rarity: 'common', id: 'pick_common', name: 'Wooden Pickaxe', power: 1, mineSpeed: 1.1, price: 20, headColor: '#a16207' },
  { rarity: 'uncommon', id: 'pick_uncommon', name: 'Copper Pickaxe', power: 2, mineSpeed: 1.5, price: 90, headColor: '#4ade80' },
  { rarity: 'rare', id: 'pick_rare', name: 'Cobalt Pickaxe', power: 3, mineSpeed: 2.1, price: 310, headColor: '#38bdf8' },
  { rarity: 'epic', id: 'pick_epic', name: 'Amethyst Pickaxe', power: 4, mineSpeed: 2.9, price: 950, headColor: '#c084fc' },
  { rarity: 'legendary', id: 'pick_legendary', name: 'Sunfire Pickaxe', power: 5, mineSpeed: 4.0, price: 2800, headColor: '#fbbf24' },
  { rarity: 'mythic', id: 'pick_mythic', name: 'Worldbreaker Pickaxe', power: 6, mineSpeed: 6.0, price: 8200, headColor: '#ff3e6c' }
];

PICKAXE_TEMPLATES.forEach(p => {
  registerItem({
    ...p,
    type: 'tool',
    slot: 'tool',
    levelReq: 1,
    desc: `Mining Power Tier ${p.power} (${p.mineSpeed}x speed). Mines ores up to ${RARITIES[p.rarity].name} tier.`
  });
});

// Armor sets across all 6 rarities
const ARMOR_PREFIXES = {
  common: { prefix: 'Leather', baseDef: 2, baseHp: 10, basePrice: 20 },
  uncommon: { prefix: 'Chainmail', baseDef: 5, baseHp: 22, basePrice: 85 },
  rare: { prefix: 'Cobalt Plate', baseDef: 11, baseHp: 45, basePrice: 270 },
  epic: { prefix: 'Shadowsteel', baseDef: 21, baseHp: 90, basePrice: 850 },
  legendary: { prefix: 'Dragonscale', baseDef: 38, baseHp: 175, basePrice: 2600 },
  mythic: { prefix: 'Celestial', baseDef: 68, baseHp: 340, basePrice: 7800 }
};

const ARMOR_SLOTS = [
  { slot: 'helmet', label: 'Helm', defWeight: 0.9, hpWeight: 0.9, priceWeight: 0.9 },
  { slot: 'chestplate', label: 'Cuirass', defWeight: 1.35, hpWeight: 1.35, priceWeight: 1.25 },
  { slot: 'leggings', label: 'Greaves', defWeight: 1.05, hpWeight: 1.05, priceWeight: 1.0 },
  { slot: 'boots', label: 'Sabatons', defWeight: 0.75, hpWeight: 0.75, priceWeight: 0.85 }
];

RARITY_ORDER.forEach(rarity => {
  const cfg = ARMOR_PREFIXES[rarity];
  const rInfo = RARITIES[rarity];
  ARMOR_SLOTS.forEach(s => {
    const id = `armor_${rarity}_${s.slot}`;
    const def = Math.max(1, Math.round(cfg.baseDef * s.defWeight));
    const hp = Math.max(5, Math.round(cfg.baseHp * s.hpWeight));
    const price = Math.max(15, Math.round(cfg.basePrice * s.priceWeight / 5) * 5);
    registerItem({
      id,
      name: `${cfg.prefix} ${s.label}`,
      rarity,
      type: 'armor',
      slot: s.slot,
      def,
      hp,
      price,
      levelReq: rInfo.levelReq,
      desc: `Requires Hero Lv.${rInfo.levelReq}. Part of the ${rInfo.setName}. Can be tempered up to +50 at the Blacksmith!`
    });
  });
});

// Potions, Buff Elixirs & Monster Loot Chests
const CONSUMABLES = [
  { id: 'potion_small', name: 'Minor Health Potion', rarity: 'common', type: 'consumable', heal: 65, price: 15, desc: 'Restores 65 HP instantly.' },
  { id: 'potion_medium', name: 'Greater Health Potion', rarity: 'uncommon', type: 'consumable', heal: 180, price: 50, desc: 'Restores 180 HP instantly.' },
  { id: 'potion_large', name: 'Superior Elixir', rarity: 'rare', type: 'consumable', heal: 480, price: 150, desc: 'Restores 480 HP instantly.' },
  { id: 'potion_supreme', name: 'Phoenix Nectar', rarity: 'epic', type: 'consumable', heal: 1400, price: 450, desc: 'Restores 1,400 HP instantly.' },
  { id: 'potion_berserk', name: 'Berserker Rage Draught', rarity: 'rare', type: 'consumable', heal: 200, buffType: 'berserk', price: 180, desc: 'Restores 200 HP and grants +35% Attack & Speed for 30 seconds!' },
  // Monster Drop Chests (Tiered 1 to 6)
  { id: 'chest_tier_1', name: 'Wooden Monster Chest', rarity: 'common', type: 'chest', chestTier: 1, price: 55, desc: 'Dropped by Lv.1-3 monsters. Open for Common-Uncommon gear & Gold!' },
  { id: 'chest_tier_2', name: 'Reinforced Iron Chest', rarity: 'uncommon', type: 'chest', chestTier: 2, price: 150, desc: 'Dropped by Forest & Desert foes. Contains Uncommon-Rare gear!' },
  { id: 'chest_tier_3', name: 'Runed Cobalt Chest', rarity: 'rare', type: 'chest', chestTier: 3, price: 400, desc: 'Dropped by Quarry & Tundra foes. High chance for Rare & Epic gear!' },
  { id: 'chest_tier_4', name: 'Cursed Obsidian Chest', rarity: 'epic', type: 'chest', chestTier: 4, price: 1050, desc: 'Dropped by Shadowlands monsters. Contains Epic or Legendary equipment!' },
  { id: 'chest_tier_5', name: 'Golden Dragon Hoard', rarity: 'legendary', type: 'chest', chestTier: 5, price: 2800, desc: 'Dropped by Volcanic Titans. Contains Legendary or Mythic relics!' },
  { id: 'chest_tier_6', name: 'Mythic Abyssal Reliquary', rarity: 'mythic', type: 'chest', chestTier: 6, price: 7500, desc: 'Dropped by World Bosses! Guaranteed Legendary/Mythic gear & huge Gold!' }
];

CONSUMABLES.forEach(registerItem);

// 10 Mineable & Placeable Blocks / Ores
const BLOCK_ITEMS = [
  { id: 'block_wood', name: 'Oak Planks Block', rarity: 'common', type: 'block', blockType: 1, price: 4, sellPrice: 2, reqPower: 1, blockHp: 25, topColor: '#b47b44', sideColor: '#7c4d25', desc: 'Sturdy wooden construction block. Right-click (or B) to place!' },
  { id: 'block_stone', name: 'Cobblestone Block', rarity: 'common', type: 'block', blockType: 2, price: 5, sellPrice: 3, reqPower: 1, blockHp: 35, topColor: '#94a3b8', sideColor: '#475569', desc: 'Solid stone wall block. Place to build forts or barriers!' },
  { id: 'block_brick', name: 'Castle Brick Block', rarity: 'uncommon', type: 'block', blockType: 8, price: 10, sellPrice: 5, reqPower: 1, blockHp: 60, topColor: '#dc2626', sideColor: '#7f1d1d', desc: 'Decorative crimson castle brick block for building grand bases.' },
  { id: 'block_lantern', name: 'Glowstone Lantern Block', rarity: 'rare', type: 'block', blockType: 9, price: 20, sellPrice: 10, reqPower: 1, blockHp: 30, topColor: '#fde047', sideColor: '#ca8a04', speckle: '#ffffff', desc: 'Radiant lantern block that illuminates your builds!' },
  { id: 'block_copper', name: 'Copper Ore Block', rarity: 'uncommon', type: 'block', blockType: 3, price: 24, sellPrice: 14, reqPower: 1, blockHp: 45, topColor: '#d97706', sideColor: '#78350f', speckle: '#34d399', desc: 'Uncommon ore. Sell at any shop for 14 Gold or place as a block!' },
  { id: 'block_iron', name: 'Iron Ore Block', rarity: 'rare', type: 'block', blockType: 4, price: 55, sellPrice: 32, reqPower: 2, blockHp: 80, topColor: '#60a5fa', sideColor: '#1e3a8a', speckle: '#e0f2fe', desc: 'Rare metallic ore. Requires Copper Pickaxe+. Sells for 32 Gold!' },
  { id: 'block_gold', name: 'Gold Ore Block', rarity: 'epic', type: 'block', blockType: 5, price: 120, sellPrice: 72, reqPower: 3, blockHp: 130, topColor: '#facc15', sideColor: '#854d0e', speckle: '#fef08a', desc: 'Rich Gold vein! Requires Cobalt Pickaxe+. Sells for 72 Gold!' },
  { id: 'block_diamond', name: 'Frost Diamond Ore', rarity: 'epic', type: 'block', blockType: 10, price: 180, sellPrice: 105, reqPower: 3, blockHp: 165, topColor: '#67e8f9', sideColor: '#0e7490', speckle: '#ffffff', desc: 'Found in the Frostpeak Tundra! Sells for 105 Gold!' },
  { id: 'block_mythril', name: 'Mythril Crystal Block', rarity: 'legendary', type: 'block', blockType: 6, price: 280, sellPrice: 175, reqPower: 4, blockHp: 210, topColor: '#38bdf8', sideColor: '#0369a1', speckle: '#f0abfc', desc: 'Shimmering Legendary crystal! Sells for 175 Gold.' },
  { id: 'block_celestite', name: 'Celestite Core Block', rarity: 'mythic', type: 'block', blockType: 7, price: 650, sellPrice: 400, reqPower: 5, blockHp: 320, topColor: '#f43f5e', sideColor: '#881337', speckle: '#fde047', desc: 'Mythic star-forged ore! Sells for 400 Gold each.' }
];

const BLOCK_BY_TYPE = {};
BLOCK_ITEMS.forEach(b => {
  registerItem(b);
  BLOCK_BY_TYPE[b.blockType] = b;
});

// Inject Pixel-Art HUD Resource Icons
document.getElementById('hud-icon-gold').innerHTML = SpriteEngine.getIconHtml('coin', '#fbbf24', '#f59e0b', 20);
document.getElementById('hud-icon-bone').innerHTML = SpriteEngine.getIconHtml('bone', '#e2e8f0', '#94a3b8', 20);
document.getElementById('hud-icon-atk').innerHTML = SpriteEngine.getIconHtml('sword', '#f87171', '#fbbf24', 20);
document.getElementById('hud-icon-def').innerHTML = SpriteEngine.getIconHtml('shield', '#60a5fa', '#cbd5e1', 20);

// ==========================================
// 3. ARMOR UPGRADE MATH (+1 to +50)
// ==========================================
const MAX_ARMOR_UPGRADE = 50;

function getArmorStats(itemInstance) {
  const base = ITEM_DB[itemInstance.id];
  if (!base || base.type !== 'armor') return { def: 0, hp: 0 };
  const upg = itemInstance.upgrade || 0;
  const def = Math.round(base.def * (1 + upg * 0.15) + upg * 1.6);
  const hp = Math.round(base.hp * (1 + upg * 0.15) + upg * 7);
  return { def, hp };
}

function getUpgradeCost(itemInstance) {
  const base = ITEM_DB[itemInstance.id];
  const nextLevel = (itemInstance.upgrade || 0) + 1;
  const rarityIdx = RARITY_ORDER.indexOf(base.rarity) + 1;
  return Math.round(14 * rarityIdx + Math.pow(nextLevel, 1.62) * (5 + rarityIdx * 2));
}

function getItemDisplayName(itemInstance) {
  const base = ITEM_DB[itemInstance.id];
  if (!base) return 'Unknown';
  const upg = itemInstance.upgrade ? ` +${itemInstance.upgrade}` : '';
  return `${base.name}${upg}`;
}

// ==========================================
// 4. MASSIVE 160x160 WORLD MAP & 7 BIOMES
// ==========================================
const TILE_SIZE = 48;
const MAP_W = 160;
const MAP_H = 160;
const VILLAGE_CENTER = { x: 80, y: 80 };

const GROUND = {
  GRASS: 0,
  PATH: 1,
  PLAZA: 2,
  FOREST: 3,
  QUARRY: 4,
  SHADOW: 5,
  VOLCANIC: 6,
  WATER: 7,
  DESERT: 8,
  TUNDRA: 9
};

const worldGround = new Uint8Array(MAP_W * MAP_H);
const worldBlocks = new Array(MAP_W * MAP_H).fill(null);
const worldProps = [];

// 4 Interactive Village Buildings in Oakhaven Village
const BUILDINGS = [
  {
    id: 'shop_weapons',
    name: 'Ironheart Armory (Weapons & Armor)',
    npcName: 'Garrick the Armorer',
    shopType: 'armory',
    tx: 71,
    ty: 72,
    tw: 6,
    th: 3,
    roofColor: '#b91c1c',
    roofDark: '#7f1d1d',
    wallColor: '#e7e5e4',
    trimColor: '#78350f',
    signIconKind: 'sword',
    npcX: 74.0,
    npcY: 75.8,
    npcColor: '#ef4444',
    npcHelm: '#94a3b8',
    greeting: 'Welcome, warrior! Equip a matching 4-piece Armor Set for massive bonuses—and level up to unlock higher rarities!'
  },
  {
    id: 'shop_tools',
    name: 'Starlight Emporium (Potions, Pickaxes & Blocks)',
    npcName: 'Lyra the Alchemist',
    shopType: 'general',
    tx: 83,
    ty: 72,
    tw: 6,
    th: 3,
    roofColor: '#1d4ed8',
    roofDark: '#1e3a8a',
    wallColor: '#e7e5e4',
    trimColor: '#475569',
    signIconKind: 'potion',
    npcX: 86.0,
    npcY: 75.8,
    npcColor: '#38bdf8',
    npcHelm: null,
    greeting: 'Grab your Pickaxe and Potions here! You can also sell your mined Ores and Monster Bones for Gold.'
  },
  {
    id: 'shop_blacksmith',
    name: 'Bram\'s Master Forge (Armor Upgrades +1 to +50)',
    npcName: 'Bram the Master Blacksmith',
    shopType: 'blacksmith',
    tx: 72,
    ty: 83,
    tw: 6,
    th: 3,
    roofColor: '#d97706',
    roofDark: '#92400e',
    wallColor: '#d6d3d1',
    trimColor: '#292524',
    signIconKind: 'anvil',
    npcX: 75.0,
    npcY: 86.8,
    npcColor: '#f59e0b',
    npcHelm: '#fbbf24',
    greeting: 'Step up to my anvil! For Gold, I can temper any piece of armor from +1 all the way to +50!'
  },
  {
    id: 'shop_bones',
    name: 'Bone Hunter\'s Guild (Chests & Elixirs)',
    npcName: 'Vaelen the Relic Hunter',
    shopType: 'relics',
    tx: 83,
    ty: 83,
    tw: 6,
    th: 3,
    roofColor: '#6d28d9',
    roofDark: '#4c1d95',
    wallColor: '#e7e5e4',
    trimColor: '#3b0764',
    signIconKind: 'chest',
    npcX: 86.0,
    npcY: 86.8,
    npcColor: '#a855f7',
    npcHelm: '#c084fc',
    greeting: 'Bring me the spoils of your hunts! Sell your Monster Bones for top Gold or buy Mystery Loot Chests directly!'
  }
];

function idx(tx, ty) {
  return ty * MAP_W + tx;
}

function inBounds(tx, ty) {
  return tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H;
}

function getZoneAt(tx, ty) {
  const dx = tx - VILLAGE_CENTER.x;
  const dy = ty - VILLAGE_CENTER.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 16.5) {
    return { id: 'village', name: 'Oakhaven Village (Safe Zone)', safe: true };
  }
  if (tx < 52 && ty < 60) {
    return { id: 'tundra', name: 'Frostpeak Tundra (Lv. 8-14)', safe: false };
  }
  if (ty < 52 && tx >= 52 && tx <= 112) {
    return { id: 'quarry', name: 'Northern Crystal Quarry (Lv. 5-11)', safe: false };
  }
  if (tx < 55 && ty >= 60) {
    return { id: 'desert', name: 'Sunscorched Dunes (Lv. 4-9)', safe: false };
  }
  if (tx >= 106 && ty < 108) {
    return { id: 'shadow', name: 'Eastern Shadowlands (Lv. 11-17)', safe: false };
  }
  if (ty >= 108) {
    return { id: 'volcanic', name: 'Southern Dragon Peaks (Lv. 16-25)', safe: false };
  }
  return { id: 'forest', name: 'Whispering Wilds (Lv. 1-6)', safe: false };
}

function placeWorldBlock(tx, ty, blockType) {
  if (!inBounds(tx, ty)) return false;
  const bDef = BLOCK_BY_TYPE[blockType];
  if (!bDef) return false;
  worldBlocks[idx(tx, ty)] = {
    type: blockType,
    hp: bDef.blockHp,
    maxHp: bDef.blockHp
  };
  return true;
}

function generateWorld() {
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (tx === 0 || ty === 0 || tx === MAP_W - 1 || ty === MAP_H - 1) {
        worldGround[idx(tx, ty)] = GROUND.WATER;
        placeWorldBlock(tx, ty, 2);
        continue;
      }

      const z = getZoneAt(tx, ty);
      const dist = Math.hypot(tx - VILLAGE_CENTER.x, ty - VILLAGE_CENTER.y);

      if (z.id === 'village') {
        worldGround[idx(tx, ty)] = dist < 7 ? GROUND.PLAZA : GROUND.GRASS;
      } else if (z.id === 'tundra') {
        worldGround[idx(tx, ty)] = GROUND.TUNDRA;
      } else if (z.id === 'quarry') {
        worldGround[idx(tx, ty)] = GROUND.QUARRY;
      } else if (z.id === 'desert') {
        worldGround[idx(tx, ty)] = GROUND.DESERT;
      } else if (z.id === 'shadow') {
        worldGround[idx(tx, ty)] = GROUND.SHADOW;
      } else if (z.id === 'volcanic') {
        worldGround[idx(tx, ty)] = GROUND.VOLCANIC;
      } else {
        worldGround[idx(tx, ty)] = GROUND.FOREST;
      }

      // Grand Cobblestone Highways radiating North, South, East, West from Oakhaven Village
      if ((Math.abs(tx - VILLAGE_CENTER.x) <= 1 && ty > 10 && ty < MAP_H - 10) ||
          (Math.abs(ty - VILLAGE_CENTER.y) <= 1 && tx > 10 && tx < MAP_W - 10)) {
        worldGround[idx(tx, ty)] = GROUND.PATH;
      }
    }
  }

  // Village Fortress Perimeter Wall with 4 Grand Gateways
  const wallMin = 65, wallMax = 95;
  for (let t = wallMin; t <= wallMax; t++) {
    const isGate = Math.abs(t - VILLAGE_CENTER.x) <= 2;
    if (!isGate) {
      placeWorldBlock(t, wallMin, 2);
      placeWorldBlock(t, wallMax, 2);
      placeWorldBlock(wallMin, t, 2);
      placeWorldBlock(wallMax, t, 2);
    }
  }

  // Village Street Lamps
  [
    [77, 77], [83, 77], [77, 83], [83, 83],
    [79, 67], [81, 67], [79, 93], [81, 93],
    [67, 79], [67, 81], [93, 79], [93, 81]
  ].forEach(([lx, ly]) => worldProps.push({ type: 'lamp', tx: lx, ty: ly }));

  // Populate Ores, Crystals, and Trees across the 7 Biomes
  for (let ty = 2; ty < MAP_H - 2; ty++) {
    for (let tx = 2; tx < MAP_W - 2; tx++) {
      const dist = Math.hypot(tx - VILLAGE_CENTER.x, ty - VILLAGE_CENTER.y);
      if (dist < 18) continue;
      if (worldGround[idx(tx, ty)] === GROUND.PATH) continue;
      if (worldBlocks[idx(tx, ty)]) continue;

      const r = Math.random();
      const g = worldGround[idx(tx, ty)];

      if (g === GROUND.FOREST) {
        if (r < 0.042) worldProps.push({ type: 'tree', tx, ty });
        else if (r < 0.064) placeWorldBlock(tx, ty, 3);
        else if (r < 0.078) placeWorldBlock(tx, ty, 2);
      } else if (g === GROUND.DESERT) {
        if (r < 0.025) worldProps.push({ type: 'palm', tx, ty });
        else if (r < 0.060) placeWorldBlock(tx, ty, 3);
        else if (r < 0.092) placeWorldBlock(tx, ty, 5);
      } else if (g === GROUND.QUARRY) {
        if (r < 0.045) placeWorldBlock(tx, ty, 3);
        else if (r < 0.105) placeWorldBlock(tx, ty, 4);
        else if (r < 0.135) placeWorldBlock(tx, ty, 5);
        else if (r < 0.165) placeWorldBlock(tx, ty, 2);
      } else if (g === GROUND.TUNDRA) {
        if (r < 0.035) worldProps.push({ type: 'pine', tx, ty });
        else if (r < 0.075) placeWorldBlock(tx, ty, 4);
        else if (r < 0.115) placeWorldBlock(tx, ty, 10);
      } else if (g === GROUND.SHADOW) {
        if (r < 0.032) worldProps.push({ type: 'deadtree', tx, ty });
        else if (r < 0.068) placeWorldBlock(tx, ty, 5);
        else if (r < 0.102) placeWorldBlock(tx, ty, 6);
      } else if (g === GROUND.VOLCANIC) {
        if (r < 0.035) placeWorldBlock(tx, ty, 5);
        else if (r < 0.070) placeWorldBlock(tx, ty, 6);
        else if (r < 0.105) placeWorldBlock(tx, ty, 7);
      }
    }
  }

  // Starter Ore Cluster right outside the North Gate
  placeWorldBlock(78, 63, 3);
  placeWorldBlock(82, 63, 3);
  placeWorldBlock(83, 63, 2);
  placeWorldBlock(77, 63, 4);
}

// ==========================================
// 5. PLAYER STATE, SKILLS & QUEST PROGRESSION
// ==========================================
const player = {
  x: VILLAGE_CENTER.x * TILE_SIZE,
  y: (VILLAGE_CENTER.y - 1) * TILE_SIZE,
  radius: 14,
  facing: 'down',
  walkAnim: 0,
  swingTimer: 0,
  swingAngle: 0,
  comboStep: 0,

  dashCd: 0,
  dashTimer: 0,
  dashAngle: 0,
  whirlwindCd: 0,
  whirlwindTimer: 0,
  berserkTimer: 0,

  level: 1,
  xp: 0,
  xpNext: 80,
  hp: 100,
  maxHp: 100,
  gold: 100,
  bones: 0,
  kills: 0,
  minedCount: 0,

  equipment: {
    weapon: null,
    tool: null,
    helmet: null,
    chestplate: null,
    leggings: null,
    boots: null
  },

  inventory: [],
  activeHotbarIndex: 0,
  selectedPlaceBlockId: 'block_wood',
  questIndex: 0
};

let nextItemUid = 1;

const QUEST_CHAIN = [
  {
    title: 'Gear Up in Oakhaven',
    check: () => player.equipment.weapon !== null || player.equipment.tool !== null,
    progressText: () => 'Buy a Weapon or Pickaxe at a Shop [F]',
    rewardGold: 45,
    rewardXp: 35
  },
  {
    title: 'First Monster Hunt',
    check: () => player.kills >= 3,
    progressText: () => `Slay Monsters outside village (${Math.min(3, player.kills)}/3)`,
    rewardGold: 90,
    rewardXp: 70
  },
  {
    title: 'Prospector\'s Pickaxe',
    check: () => player.minedCount >= 4,
    progressText: () => `Mine 4 Ore or Stone Blocks (${Math.min(4, player.minedCount)}/4)`,
    rewardGold: 120,
    rewardXp: 100
  },
  {
    title: 'Blacksmith\'s Apprentice',
    check: () => {
      return ['helmet', 'chestplate', 'leggings', 'boots'].some(s => (player.equipment[s]?.upgrade || 0) >= 3);
    },
    progressText: () => 'Upgrade any Armor to +3 at Bram\'s Forge',
    rewardGold: 220,
    rewardXp: 180
  },
  {
    title: 'Full Set Synergy',
    check: () => getActiveSetBonus() !== null,
    progressText: () => 'Equip a 4/4 Matching Rarity Armor Set',
    rewardGold: 400,
    rewardXp: 320
  },
  {
    title: 'Conqueror of Valoria',
    check: () => player.level >= 20,
    progressText: () => `Reach Hero Level 20 (${player.level}/20) & Slay World Bosses`,
    rewardGold: 2500,
    rewardXp: 1500
  }
];

function checkQuestCompletion() {
  const q = QUEST_CHAIN[player.questIndex];
  if (!q) {
    document.getElementById('quest-title').textContent = 'Legend of Valoria';
    document.getElementById('quest-progress').textContent = 'Forge +50 Mythic Gear & Slay Bosses!';
    return;
  }
  document.getElementById('quest-title').textContent = q.title;
  document.getElementById('quest-progress').textContent = q.progressText();

  if (q.check()) {
    player.gold += q.rewardGold;
    player.questIndex++;
    SoundFX.levelUp();
    showToast(`QUEST COMPLETE: "${q.title}"! +${q.rewardGold} Gold & +${q.rewardXp} XP!`);
    gainXp(q.rewardXp);
    checkQuestCompletion();
  }
}

function addItemToInventory(itemId, qty = 1, upgrade = 0) {
  const base = ITEM_DB[itemId];
  if (!base) return null;

  if (base.type === 'consumable' || base.type === 'chest' || base.type === 'block') {
    const existing = player.inventory.find(i => i.id === itemId);
    if (existing) {
      existing.qty += qty;
      updateHotbarUI();
      return existing;
    }
    const created = { uid: nextItemUid++, id: itemId, qty, upgrade: 0 };
    player.inventory.push(created);
    if (base.type === 'block' && !player.selectedPlaceBlockId) {
      player.selectedPlaceBlockId = itemId;
    }
    updateHotbarUI();
    return created;
  }

  let lastCreated = null;
  for (let i = 0; i < qty; i++) {
    lastCreated = { uid: nextItemUid++, id: itemId, qty: 1, upgrade };
    player.inventory.push(lastCreated);
  }
  updateHotbarUI();
  return lastCreated;
}

addItemToInventory('block_wood', 12);
addItemToInventory('block_lantern', 4);

function getActiveSetBonus() {
  const slots = ['helmet', 'chestplate', 'leggings', 'boots'];
  const first = player.equipment.helmet;
  if (!first) return null;
  const targetRarity = ITEM_DB[first.id].rarity;
  for (const s of slots) {
    const eq = player.equipment[s];
    if (!eq || ITEM_DB[eq.id].rarity !== targetRarity) {
      return null;
    }
  }
  return RARITIES[targetRarity];
}

function getPlayerStats() {
  const baseAtk = 7 + (player.level - 1) * 3.5;
  const baseDef = (player.level - 1) * 1.2;
  const baseHp = 100 + (player.level - 1) * 24;

  let weaponAtk = 0;
  if (player.equipment.weapon) {
    weaponAtk = ITEM_DB[player.equipment.weapon.id].atk;
  }

  let armorDef = 0;
  let armorHp = 0;
  ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
    const eq = player.equipment[slot];
    if (eq) {
      const st = getArmorStats(eq);
      armorDef += st.def;
      armorHp += st.hp;
    }
  });

  const activeSet = getActiveSetBonus();
  const sb = activeSet ? activeSet.setBonus : { maxHp: 0, def: 0, atk: 0, atkMult: 0, speedMult: 0, critChance: 0, regen: 0, lifesteal: 0 };

  const berserkMult = player.berserkTimer > 0 ? 0.35 : 0;
  const totalMaxHp = Math.round(baseHp + armorHp + (sb.maxHp || 0));
  const rawAtk = baseAtk + weaponAtk + (sb.atk || 0);
  const totalAtk = Math.round(rawAtk * (1 + (sb.atkMult || 0) + berserkMult));
  const totalDef = Math.round(baseDef + armorDef + (sb.def || 0));
  const moveSpeed = 225 * (1 + (sb.speedMult || 0) + (player.berserkTimer > 0 ? 0.25 : 0));
  const critChance = 0.06 + (sb.critChance || 0);
  const hpRegen = 1.5 + (sb.regen || 0);
  const lifesteal = sb.lifesteal || 0;

  let pickPower = 1;
  let mineSpeed = 0.85;
  if (player.equipment.tool) {
    const t = ITEM_DB[player.equipment.tool.id];
    pickPower = t.power;
    mineSpeed = t.mineSpeed;
  }

  return {
    maxHp: totalMaxHp,
    atk: totalAtk,
    def: totalDef,
    moveSpeed,
    critChance,
    hpRegen,
    lifesteal,
    pickPower,
    mineSpeed,
    activeSet
  };
}

function syncPlayerMaxHp() {
  const st = getPlayerStats();
  player.maxHp = st.maxHp;
  if (player.hp > player.maxHp) player.hp = player.maxHp;
}

function gainXp(amount) {
  player.xp += amount;
  let leveledUp = false;
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.round(80 * Math.pow(player.level, 1.35));
    leveledUp = true;
  }
  if (leveledUp) {
    syncPlayerMaxHp();
    player.hp = player.maxHp;
    SoundFX.levelUp();
    spawnFloatingText(player.x, player.y - 40, `LEVEL UP! Lv.${player.level}`, '#fde047', 26);
    showToast(`Level Up! You reached Hero Level ${player.level}!`);
    for (let i = 0; i < 28; i++) {
      spawnParticle(player.x, player.y, '#fbbf24', 160);
    }
  }
  checkQuestCompletion();
  updateHudUI();
}

// ==========================================
// 6. 14 MONSTERS & 4 WORLD BOSSES
// ==========================================
const MONSTER_TYPES = [
  { id: 'slime', species: 'slime', name: 'Emerald Slime', biome: 'forest', level: 1, hp: 36, atk: 7, def: 1, speed: 80, xp: 24, goldMin: 9, goldMax: 18, bones: [1, 2], chestDropChance: 0.20, chestId: 'chest_tier_1', color: '#4ade80', secColor: '#15803d', eyeColor: '#064e3b', radius: 14 },
  { id: 'skeleton', species: 'skeleton', name: 'Wandering Skeleton', biome: 'forest', level: 3, hp: 85, atk: 15, def: 4, speed: 98, xp: 48, goldMin: 18, goldMax: 35, bones: [2, 4], chestDropChance: 0.22, chestId: 'chest_tier_2', color: '#e2e8f0', secColor: '#94a3b8', eyeColor: '#ef4444', radius: 15 },
  { id: 'forest_boss', species: 'golem', isBoss: true, name: 'Brambleheart, Ancient Treant', biome: 'forest', level: 6, hp: 520, atk: 34, def: 12, speed: 82, xp: 320, goldMin: 180, goldMax: 280, bones: [6, 10], chestDropChance: 0.75, chestId: 'chest_tier_3', color: '#16a34a', secColor: '#78350f', eyeColor: '#fde047', radius: 24 },

  { id: 'scorpion', species: 'wraith', name: 'Venom Sand Scorpion', biome: 'desert', level: 5, hp: 140, atk: 24, def: 8, speed: 112, xp: 75, goldMin: 32, goldMax: 58, bones: [2, 4], chestDropChance: 0.22, chestId: 'chest_tier_2', color: '#f59e0b', secColor: '#b45309', eyeColor: '#dc2626', radius: 15 },
  { id: 'mummy', species: 'skeleton', name: 'Pharaoh\'s Cursed Guard', biome: 'desert', level: 8, hp: 260, atk: 40, def: 15, speed: 92, xp: 135, goldMin: 55, goldMax: 95, bones: [3, 6], chestDropChance: 0.25, chestId: 'chest_tier_3', color: '#fef08a', secColor: '#ca8a04', eyeColor: '#38bdf8', radius: 16 },

  { id: 'goblin', species: 'goblin', name: 'Quarry Goblin Raider', biome: 'quarry', level: 6, hp: 185, atk: 30, def: 10, speed: 115, xp: 98, goldMin: 40, goldMax: 72, bones: [2, 5], chestDropChance: 0.24, chestId: 'chest_tier_3', color: '#84cc16', secColor: '#4d7c0f', eyeColor: '#facc15', radius: 15 },
  { id: 'golem', species: 'golem', name: 'Cobalt Crystal Golem', biome: 'quarry', level: 9, hp: 390, atk: 52, def: 22, speed: 75, xp: 190, goldMin: 80, goldMax: 140, bones: [3, 6], chestDropChance: 0.28, chestId: 'chest_tier_3', color: '#38bdf8', secColor: '#0369a1', eyeColor: '#e0f2fe', radius: 19 },

  { id: 'frost_wolf', species: 'goblin', name: 'Glacier Direwolf', biome: 'tundra', level: 10, hp: 460, atk: 65, def: 26, speed: 128, xp: 240, goldMin: 95, goldMax: 165, bones: [4, 7], chestDropChance: 0.26, chestId: 'chest_tier_4', color: '#bae6fd', secColor: '#0284c7', eyeColor: '#fef08a', radius: 16 },
  { id: 'frost_boss', species: 'frost_titan', isBoss: true, name: 'Borealis, Frostpeak Behemoth', biome: 'tundra', level: 14, hp: 1650, atk: 115, def: 48, speed: 88, xp: 850, goldMin: 480, goldMax: 720, bones: [10, 16], chestDropChance: 0.80, chestId: 'chest_tier_4', color: '#38bdf8', secColor: '#1e3a8a', eyeColor: '#ff3e6c', radius: 26 },

  { id: 'wraith', species: 'wraith', name: 'Shadowlands Void Knight', biome: 'shadow', level: 13, hp: 820, atk: 98, def: 42, speed: 118, xp: 390, goldMin: 165, goldMax: 270, bones: [4, 8], chestDropChance: 0.28, chestId: 'chest_tier_4', color: '#a855f7', secColor: '#581c87', eyeColor: '#f43f5e', radius: 17 },
  { id: 'shadow_boss', species: 'lich', isBoss: true, name: 'Malakor, Arch-Lich of the Void', biome: 'shadow', level: 17, hp: 2800, atk: 175, def: 72, speed: 95, xp: 1450, goldMin: 800, goldMax: 1200, bones: [12, 20], chestDropChance: 0.85, chestId: 'chest_tier_5', color: '#c084fc', secColor: '#3b0764', eyeColor: '#4ade80', radius: 25 },

  { id: 'demon', species: 'dragon', name: 'Infernal Magma Wyrm', biome: 'volcanic', level: 18, hp: 1650, atk: 165, def: 75, speed: 108, xp: 780, goldMin: 350, goldMax: 550, bones: [6, 12], chestDropChance: 0.34, chestId: 'chest_tier_5', color: '#f97316', secColor: '#9a3412', eyeColor: '#fef08a', radius: 20 },
  { id: 'dragon_boss', species: 'boss', isBoss: true, name: 'Ignis, Mythic Abyssal Dragon', biome: 'volcanic', level: 23, hp: 5500, atk: 310, def: 130, speed: 100, xp: 3200, goldMin: 1600, goldMax: 2400, bones: [18, 30], chestDropChance: 1.0, chestId: 'chest_tier_6', color: '#ff3e6c', secColor: '#881337', eyeColor: '#fde047', radius: 30 }
];

const monsters = [];
const projectiles = [];
const groundDrops = [];
const particles = [];
const floatingTexts = [];

function spawnMonsterInBiome(mType, customX, customY) {
  let x = customX, y = customY;
  if (x === undefined || y === undefined) {
    for (let tries = 0; tries < 60; tries++) {
      const tx = 4 + Math.floor(Math.random() * (MAP_W - 8));
      const ty = 4 + Math.floor(Math.random() * (MAP_H - 8));
      const zone = getZoneAt(tx, ty);
      if (zone.safe || zone.id !== mType.biome) continue;
      if (worldBlocks[idx(tx, ty)]) continue;
      x = (tx + 0.5) * TILE_SIZE;
      y = (ty + 0.5) * TILE_SIZE;
      break;
    }
  }
  if (x === undefined) return;

  monsters.push({
    uid: Math.random(),
    type: mType,
    x,
    y,
    hp: mType.hp,
    maxHp: mType.hp,
    atkCooldown: 0,
    hurtTimer: 0,
    wanderAngle: Math.random() * Math.PI * 2,
    wanderTimer: 1 + Math.random() * 2
  });
}

function populateInitialMonsters() {
  for (let i = 0; i < 28; i++) spawnMonsterInBiome(MONSTER_TYPES[0]);
  for (let i = 0; i < 20; i++) spawnMonsterInBiome(MONSTER_TYPES[1]);
  for (let i = 0; i < 18; i++) spawnMonsterInBiome(MONSTER_TYPES[3]);
  for (let i = 0; i < 14; i++) spawnMonsterInBiome(MONSTER_TYPES[4]);
  for (let i = 0; i < 18; i++) spawnMonsterInBiome(MONSTER_TYPES[5]);
  for (let i = 0; i < 14; i++) spawnMonsterInBiome(MONSTER_TYPES[6]);
  for (let i = 0; i < 16; i++) spawnMonsterInBiome(MONSTER_TYPES[7]);
  for (let i = 0; i < 18; i++) spawnMonsterInBiome(MONSTER_TYPES[9]);
  for (let i = 0; i < 16; i++) spawnMonsterInBiome(MONSTER_TYPES[11]);

  spawnMonsterInBiome(MONSTER_TYPES[2], 98 * TILE_SIZE, 98 * TILE_SIZE);
  spawnMonsterInBiome(MONSTER_TYPES[8], 26 * TILE_SIZE, 28 * TILE_SIZE);
  spawnMonsterInBiome(MONSTER_TYPES[10], 134 * TILE_SIZE, 75 * TILE_SIZE);
  spawnMonsterInBiome(MONSTER_TYPES[12], 80 * TILE_SIZE, 138 * TILE_SIZE);

  spawnMonsterInBiome(MONSTER_TYPES[0], 80 * TILE_SIZE, 60 * TILE_SIZE);
  spawnMonsterInBiome(MONSTER_TYPES[0], 60 * TILE_SIZE, 80 * TILE_SIZE);
  spawnMonsterInBiome(MONSTER_TYPES[1], 100 * TILE_SIZE, 80 * TILE_SIZE);
}

// ==========================================
// 7. CHEST LOOT GENERATOR (Scaled by Monster Difficulty)
// ==========================================
function openMonsterChest(chestItemId) {
  const chestDef = ITEM_DB[chestItemId];
  if (!chestDef || chestDef.type !== 'chest') return;

  const invEntry = player.inventory.find(i => i.id === chestItemId);
  if (!invEntry || invEntry.qty <= 0) return;
  invEntry.qty--;
  if (invEntry.qty <= 0) {
    player.inventory = player.inventory.filter(i => i !== invEntry);
  }

  SoundFX.chest();

  const tier = chestDef.chestTier;
  const weightsByTier = {
    1: { common: 50, uncommon: 42, rare: 8, epic: 0, legendary: 0, mythic: 0 },
    2: { common: 12, uncommon: 54, rare: 29, epic: 5, legendary: 0, mythic: 0 },
    3: { common: 0, uncommon: 22, rare: 54, epic: 21, legendary: 3, mythic: 0 },
    4: { common: 0, uncommon: 0, rare: 24, epic: 56, legendary: 17, mythic: 3 },
    5: { common: 0, uncommon: 0, rare: 0, epic: 30, legendary: 55, mythic: 15 },
    6: { common: 0, uncommon: 0, rare: 0, epic: 8, legendary: 47, mythic: 45 }
  };

  const weights = weightsByTier[tier] || weightsByTier[1];
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let chosenRarity = 'common';
  for (const [rKey, w] of Object.entries(weights)) {
    if (roll < w) {
      chosenRarity = rKey;
      break;
    }
    roll -= w;
  }

  const candidates = Object.values(ITEM_DB).filter(
    item => item.rarity === chosenRarity && (item.type === 'weapon' || item.type === 'armor' || item.type === 'tool')
  );
  const wonItem = candidates[Math.floor(Math.random() * candidates.length)];

  let bonusUpgrade = 0;
  if (wonItem.type === 'armor' && tier >= 2) {
    bonusUpgrade = Math.floor(Math.random() * (tier * 2.5)) + 1;
  }

  const bonusGold = Math.round((30 * Math.pow(tier, 1.85)) * (0.85 + Math.random() * 0.4));
  player.gold += bonusGold;
  const createdInstance = addItemToInventory(wonItem.id, 1, bonusUpgrade);

  const rInfo = RARITIES[chosenRarity];
  const modal = document.getElementById('modal-chest');
  const body = document.getElementById('chest-loot-result');
  body.innerHTML = `
    <div>${getItemIconHtml(wonItem, 56)}</div>
    <div class="rarity-tag rarity-${chosenRarity}">${rInfo.name} Reward</div>
    <div style="font-size: 28px; color: ${rInfo.color}; font-weight: bold;">
      ${getItemDisplayName(createdInstance)}
    </div>
    <div style="color: #cbd5e1; max-width: 390px;">${wonItem.desc}</div>
    <div style="color: #fbbf24; font-size: 22px;">+ ${SpriteEngine.getIconHtml('coin', '#fbbf24', '#f59e0b', 20)} ${bonusGold} Bonus Gold!</div>
    <button class="pixel-btn action-btn" id="btn-chest-claim">Claim Loot!</button>
  `;
  modal.classList.remove('hidden');
  document.getElementById('btn-chest-claim').onclick = () => {
    modal.classList.add('hidden');
  };

  updateHudUI();
  updateHotbarUI();
  renderInventoryModal();
}

// ==========================================
// 8. COLLISION & PHYSICS HELPERS
// ==========================================
function isSolidAtTile(tx, ty) {
  if (!inBounds(tx, ty)) return true;
  if (worldBlocks[idx(tx, ty)]) return true;
  for (const b of BUILDINGS) {
    if (tx >= b.tx && tx < b.tx + b.tw && ty >= b.ty && ty < b.ty + b.th) {
      return true;
    }
  }
  return false;
}

function moveEntityWithCollision(ent, dx, dy) {
  const r = ent.radius || 14;
  const nextX = ent.x + dx;
  const minTx = Math.floor((nextX - r) / TILE_SIZE);
  const maxTx = Math.floor((nextX + r) / TILE_SIZE);
  const minTy = Math.floor((ent.y - r) / TILE_SIZE);
  const maxTy = Math.floor((ent.y + r) / TILE_SIZE);

  let hitX = false;
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (isSolidAtTile(tx, ty)) hitX = true;
    }
  }
  if (!hitX) ent.x = nextX;

  const nextY = ent.y + dy;
  const minTx2 = Math.floor((ent.x - r) / TILE_SIZE);
  const maxTx2 = Math.floor((ent.x + r) / TILE_SIZE);
  const minTy2 = Math.floor((nextY - r) / TILE_SIZE);
  const maxTy2 = Math.floor((nextY + r) / TILE_SIZE);

  let hitY = false;
  for (let ty = minTy2; ty <= maxTy2; ty++) {
    for (let tx = minTx2; tx <= maxTx2; tx++) {
      if (isSolidAtTile(tx, ty)) hitY = true;
    }
  }
  if (!hitY) ent.y = nextY;
}

// ==========================================
// 9. INPUT, COMBAT, SKILLS & MINING
// ==========================================
const keys = {};
let mouseScreenX = 0;
let mouseScreenY = 0;
let mouseWorldX = 0;
let mouseWorldY = 0;
let isLeftMouseDown = false;
let actionCooldown = 0;
let screenShake = 0;

window.addEventListener('keydown', e => {
  keys[e.code] = true;

  if (e.code === 'KeyI' || e.code === 'KeyE') {
    toggleModal('modal-inventory');
  } else if (e.code === 'KeyH') {
    toggleModal('modal-help');
  } else if (e.code === 'KeyF') {
    tryInteractWithBuilding();
  } else if (e.code === 'KeyB') {
    tryPlaceSelectedBlock();
  } else if (e.code === 'KeyT') {
    teleportToVillage();
  } else if (e.code === 'KeyQ') {
    triggerWhirlwindSkill();
  } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    triggerDashSkill();
  } else if (e.code === 'KeyM') {
    toggleSoundBtn();
  } else if (e.code === 'Escape') {
    closeAllModals();
  } else if (e.code.startsWith('Digit')) {
    const num = parseInt(e.code.replace('Digit', ''), 10);
    if (num >= 1 && num <= 8) {
      selectHotbarSlot(num - 1);
    }
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseScreenX = e.clientX - rect.left;
  mouseScreenY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
  if (isAnyModalOpen()) return;
  if (e.button === 0) {
    isLeftMouseDown = true;
    performPrimaryAction();
  } else if (e.button === 2) {
    tryPlaceSelectedBlock();
  }
});

window.addEventListener('mouseup', e => {
  if (e.button === 0) isLeftMouseDown = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

function teleportToVillage() {
  if (isAnyModalOpen()) closeAllModals();
  player.x = VILLAGE_CENTER.x * TILE_SIZE;
  player.y = (VILLAGE_CENTER.y - 1) * TILE_SIZE;
  SoundFX.levelUp();
  for (let i = 0; i < 20; i++) spawnParticle(player.x, player.y, '#38bdf8', 130);
  showToast('Teleported back to Oakhaven Village Plaza!');
}

document.getElementById('btn-recall').onclick = teleportToVillage;

function toggleSoundBtn() {
  const on = SoundFX.toggle();
  document.getElementById('btn-sound').textContent = on ? 'SFX: ON' : 'SFX: OFF';
}
document.getElementById('btn-sound').onclick = toggleSoundBtn;

function triggerDashSkill() {
  if (isAnyModalOpen() || player.dashCd > 0) return;
  player.dashCd = 2.2;
  player.dashTimer = 0.18;
  player.dashAngle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
  SoundFX.dash();
  for (let i = 0; i < 12; i++) {
    spawnParticle(player.x, player.y, '#38bdf8', 110);
  }
}

function triggerWhirlwindSkill() {
  if (isAnyModalOpen() || player.whirlwindCd > 0) return;
  player.whirlwindCd = 4.5;
  player.whirlwindTimer = 0.36;
  SoundFX.whirlwind();
  screenShake = 0.18;

  const st = getPlayerStats();
  const radius = 115;
  for (let i = 0; i < 28; i++) {
    spawnParticle(player.x, player.y, '#fbbf24', 180);
  }

  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    const dist = Math.hypot(m.x - player.x, m.y - player.y);
    if (dist <= radius + m.type.radius) {
      damageMonster(m, i, Math.round(st.atk * 1.45), true);
    }
  }
}

function damageMonster(m, index, baseDmg, forceCrit = false) {
  const st = getPlayerStats();
  const isCrit = forceCrit || Math.random() < st.critChance;
  const rawDmg = Math.max(1, baseDmg - Math.floor(m.type.def * 0.4));
  const dmg = Math.round(rawDmg * (isCrit ? 1.75 : 1) * (0.92 + Math.random() * 0.16));

  m.hp -= dmg;
  m.hurtTimer = 0.18;

  if (isCrit) {
    SoundFX.crit();
    screenShake = 0.12;
  } else {
    SoundFX.hit();
  }

  const angleToM = Math.atan2(m.y - player.y, m.x - player.x);
  moveEntityWithCollision(m, Math.cos(angleToM) * 16, Math.sin(angleToM) * 16);

  if (st.lifesteal > 0) {
    const heal = Math.max(1, Math.round(dmg * st.lifesteal));
    player.hp = Math.min(player.maxHp, player.hp + heal);
  }

  spawnFloatingText(
    m.x,
    m.y - 28,
    isCrit ? `CRIT ${dmg}!` : `-${dmg}`,
    isCrit ? '#fde047' : '#ffffff',
    isCrit ? 24 : 19
  );
  for (let p = 0; p < 7; p++) {
    spawnParticle(m.x, m.y, m.type.color, 100);
  }

  if (m.hp <= 0) {
    handleMonsterDefeat(m, index);
  }
}

function getTargetTileFromCursor() {
  const tx = Math.floor(mouseWorldX / TILE_SIZE);
  const ty = Math.floor(mouseWorldY / TILE_SIZE);
  return { tx, ty };
}

function performPrimaryAction() {
  if (actionCooldown > 0) return;

  const st = getPlayerStats();
  actionCooldown = 0.24;
  player.swingTimer = 0.22;
  player.comboStep = (player.comboStep + 1) % 3;
  SoundFX.swing();

  const dx = mouseWorldX - player.x;
  const dy = mouseWorldY - player.y;
  player.swingAngle = Math.atan2(dy, dx);
  if (Math.abs(dx) > Math.abs(dy)) {
    player.facing = dx > 0 ? 'right' : 'left';
  } else {
    player.facing = dy > 0 ? 'down' : 'up';
  }

  if (player.equipment.weapon) {
    const wDef = ITEM_DB[player.equipment.weapon.id];
    if (wDef && wDef.projectileColor) {
      projectiles.push({
        x: player.x + Math.cos(player.swingAngle) * 20,
        y: player.y - 12 + Math.sin(player.swingAngle) * 20,
        vx: Math.cos(player.swingAngle) * 440,
        vy: Math.sin(player.swingAngle) * 440,
        angle: player.swingAngle,
        color: wDef.projectileColor,
        dmg: Math.round(st.atk * 0.75),
        life: 0.65,
        hitSet: new Set()
      });
    }
  }

  let hitMonster = false;
  const reach = 82;
  const comboBonus = player.comboStep === 2 ? 1.25 : 1.0;

  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    const dist = Math.hypot(m.x - player.x, m.y - player.y);
    if (dist <= reach + m.type.radius) {
      const angleToM = Math.atan2(m.y - player.y, m.x - player.x);
      let angleDiff = Math.abs(angleToM - player.swingAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      if (angleDiff < 1.4 || dist < 42) {
        hitMonster = true;
        damageMonster(m, i, Math.round(st.atk * comboBonus));
      }
    }
  }

  if (hitMonster) {
    updateHudUI();
    return;
  }

  const { tx, ty } = getTargetTileFromCursor();
  const blockCenterX = (tx + 0.5) * TILE_SIZE;
  const blockCenterY = (ty + 0.5) * TILE_SIZE;
  const distToBlock = Math.hypot(blockCenterX - player.x, blockCenterY - player.y);

  if (inBounds(tx, ty) && distToBlock <= TILE_SIZE * 3.0) {
    const blk = worldBlocks[idx(tx, ty)];
    if (blk) {
      const bDef = BLOCK_BY_TYPE[blk.type];
      if (!player.equipment.tool && bDef.reqPower > 1) {
        spawnFloatingText(blockCenterX, blockCenterY - 20, `Needs Pickaxe!`, '#f87171', 18);
        return;
      }
      if (st.pickPower < bDef.reqPower) {
        spawnFloatingText(blockCenterX, blockCenterY - 20, `Needs Tier ${bDef.reqPower} Pickaxe!`, '#f87171', 18);
        return;
      }

      SoundFX.mine();
      const mineDmg = Math.round(20 * st.mineSpeed);
      blk.hp -= mineDmg;
      for (let p = 0; p < 6; p++) {
        spawnParticle(blockCenterX, blockCenterY - 12, bDef.topColor, 75);
      }

      if (blk.hp <= 0) {
        worldBlocks[idx(tx, ty)] = null;
        player.minedCount++;
        addItemToInventory(bDef.id, 1);
        gainXp(bDef.reqPower * 6);
        spawnFloatingText(blockCenterX, blockCenterY - 24, `+1 ${bDef.name}`, bDef.speckle || '#fde047', 18);
      } else {
        spawnFloatingText(blockCenterX, blockCenterY - 18, `${blk.hp}/${blk.maxHp}`, '#cbd5e1', 15);
      }
    }
  }
}

function tryPlaceSelectedBlock() {
  const { tx, ty } = getTargetTileFromCursor();
  if (!inBounds(tx, ty)) return;

  const blockCenterX = (tx + 0.5) * TILE_SIZE;
  const blockCenterY = (ty + 0.5) * TILE_SIZE;
  const dist = Math.hypot(blockCenterX - player.x, blockCenterY - player.y);

  if (dist > TILE_SIZE * 3.4) {
    showToast('Too far away to place a block!');
    return;
  }
  if (dist < TILE_SIZE * 0.72) {
    showToast('Cannot place a block directly on yourself!');
    return;
  }
  if (isSolidAtTile(tx, ty)) return;

  let blockEntry = player.inventory.find(i => i.id === player.selectedPlaceBlockId && ITEM_DB[i.id]?.type === 'block');
  if (!blockEntry) {
    blockEntry = player.inventory.find(i => ITEM_DB[i.id]?.type === 'block');
  }
  if (!blockEntry || blockEntry.qty <= 0) {
    showToast('No blocks in inventory! Mine stone/ores or buy blocks in the shop.');
    return;
  }

  const bDef = ITEM_DB[blockEntry.id];
  if (placeWorldBlock(tx, ty, bDef.blockType)) {
    SoundFX.place();
    blockEntry.qty--;
    if (blockEntry.qty <= 0) {
      player.inventory = player.inventory.filter(i => i !== blockEntry);
    }
    for (let p = 0; p < 6; p++) {
      spawnParticle(blockCenterX, blockCenterY - 10, bDef.topColor, 60);
    }
    updateHotbarUI();
  }
}

function handleMonsterDefeat(m, index) {
  monsters.splice(index, 1);
  player.kills++;
  const t = m.type;
  gainXp(t.xp);

  const goldAmt = t.goldMin + Math.floor(Math.random() * (t.goldMax - t.goldMin + 1));
  groundDrops.push({
    x: m.x + (Math.random() - 0.5) * 22,
    y: m.y + (Math.random() - 0.5) * 22,
    z: 14,
    vz: 95,
    type: 'gold',
    amount: goldAmt
  });

  const boneAmt = t.bones[0] + Math.floor(Math.random() * (t.bones[1] - t.bones[0] + 1));
  groundDrops.push({
    x: m.x + (Math.random() - 0.5) * 24,
    y: m.y + (Math.random() - 0.5) * 24,
    z: 16,
    vz: 115,
    type: 'bone',
    amount: boneAmt
  });

  if (Math.random() < t.chestDropChance) {
    groundDrops.push({
      x: m.x,
      y: m.y,
      z: 22,
      vz: 145,
      type: 'chest',
      chestId: t.chestId
    });
    const chestDef = ITEM_DB[t.chestId];
    showToast(`RARE DROP! ${t.name} dropped a ${chestDef.name}!`);
  }

  if (t.isBoss) {
    showToast(`WORLD BOSS DEFEATED! You conquered ${t.name}!`);
    setTimeout(() => spawnMonsterInBiome(t), 30000);
  } else {
    setTimeout(() => spawnMonsterInBiome(t), 8000);
  }
}

// ==========================================
// 10. HOTBAR & UI RENDERING
// ==========================================
function buildHotbarSlots() {
  const slots = [];
  slots.push({
    kind: 'weapon',
    label: player.equipment.weapon ? ITEM_DB[player.equipment.weapon.id].name : 'Unarmed',
    icon: player.equipment.weapon ? ITEM_DB[player.equipment.weapon.id].icon : SpriteEngine.getIconHtml('sword', '#94a3b8', '#475569', 22),
    rarity: player.equipment.weapon ? ITEM_DB[player.equipment.weapon.id].rarity : 'common'
  });
  slots.push({
    kind: 'tool',
    label: player.equipment.tool ? ITEM_DB[player.equipment.tool.id].name : 'No Pick',
    icon: player.equipment.tool ? ITEM_DB[player.equipment.tool.id].icon : SpriteEngine.getIconHtml('pickaxe', '#64748b', '#475569', 22),
    rarity: player.equipment.tool ? ITEM_DB[player.equipment.tool.id].rarity : 'common'
  });

  const quickItems = player.inventory.filter(i => {
    const d = ITEM_DB[i.id];
    return d && (d.type === 'consumable' || d.type === 'chest' || d.type === 'block');
  });

  for (let i = 0; i < 6; i++) {
    const entry = quickItems[i];
    if (entry) {
      const d = ITEM_DB[entry.id];
      slots.push({
        kind: 'item',
        entry,
        def: d,
        label: d.name,
        icon: d.icon,
        qty: entry.qty,
        rarity: d.rarity
      });
    } else {
      slots.push({ kind: 'empty', label: 'Empty', icon: '' });
    }
  }
  return slots;
}

function selectHotbarSlot(index) {
  player.activeHotbarIndex = index;
  const slots = buildHotbarSlots();
  const slot = slots[index];
  if (!slot) return;

  if (slot.kind === 'item') {
    const d = slot.def;
    if (d.type === 'consumable') {
      useConsumableItem(slot.entry.id);
    } else if (d.type === 'chest') {
      openMonsterChest(slot.entry.id);
    } else if (d.type === 'block') {
      player.selectedPlaceBlockId = slot.entry.id;
      showToast(`Selected ${d.name} (Right-Click or press B to place)`);
    }
  }
  updateHotbarUI();
}

function useConsumableItem(itemId) {
  const entry = player.inventory.find(i => i.id === itemId);
  if (!entry || entry.qty <= 0) return;
  const def = ITEM_DB[itemId];
  if (!def || def.type !== 'consumable') return;

  if (player.hp >= player.maxHp && !def.buffType) {
    showToast('Your HP is already full!');
    return;
  }

  entry.qty--;
  if (entry.qty <= 0) {
    player.inventory = player.inventory.filter(i => i !== entry);
  }
  player.hp = Math.min(player.maxHp, player.hp + def.heal);
  if (def.buffType === 'berserk') {
    player.berserkTimer = 30.0;
    showToast('BERSERKER RAGE ACTIVE! +35% Attack & +25% Speed for 30s!');
  }
  SoundFX.coin();
  spawnFloatingText(player.x, player.y - 28, `+${def.heal} HP`, '#4ade80', 21);
  updateHudUI();
  updateHotbarUI();
  renderInventoryModal();
}

function updateHotbarUI() {
  const container = document.getElementById('hotbar');
  const slots = buildHotbarSlots();
  container.innerHTML = '';

  slots.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = `hotbar-slot ${idx === player.activeHotbarIndex ? 'active' : ''} ${s.rarity ? 'rarity-' + s.rarity : ''}`;
    div.innerHTML = `
      <span class="slot-key">${idx + 1}</span>
      <span class="slot-icon">${s.icon || ''}</span>
      ${s.qty ? `<span class="slot-qty">${s.qty}</span>` : ''}
      <span class="slot-name-mini">${s.label}</span>
    `;
    div.onclick = () => selectHotbarSlot(idx);
    container.appendChild(div);
  });
}

function updateHudUI() {
  syncPlayerMaxHp();
  const st = getPlayerStats();

  document.getElementById('hud-level').textContent = player.level;
  document.getElementById('hud-hp-fill').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
  document.getElementById('hud-hp-text').textContent = `${Math.ceil(player.hp)} / ${player.maxHp} HP`;

  document.getElementById('hud-xp-fill').style.width = `${Math.min(100, (player.xp / player.xpNext) * 100)}%`;
  document.getElementById('hud-xp-text').textContent = `${player.xp} / ${player.xpNext} XP`;

  document.getElementById('hud-gold').textContent = player.gold;
  document.getElementById('hud-bones').textContent = player.bones;
  document.getElementById('hud-atk').textContent = st.atk;
  document.getElementById('hud-def').textContent = st.def;

  const setBanner = document.getElementById('set-bonus-banner');
  if (st.activeSet) {
    setBanner.classList.remove('hidden');
    setBanner.textContent = `${st.activeSet.setName} Active!`;
  } else {
    setBanner.classList.add('hidden');
  }
}

// ==========================================
// 11. INVENTORY, SHOPS & BLACKSMITH MODALS
// ==========================================
let currentBagTab = 'all';
let selectedBagUid = null;
let currentShopType = 'armory';
let selectedShopItemId = null;
let selectedSmithUid = null;

function isAnyModalOpen() {
  return document.querySelectorAll('.modal-overlay:not(.hidden)').length > 0;
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
}

function toggleModal(id) {
  const el = document.getElementById(id);
  const wasHidden = el.classList.contains('hidden');
  closeAllModals();
  if (wasHidden) {
    el.classList.remove('hidden');
    if (id === 'modal-inventory') renderInventoryModal();
  }
}

document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-close');
    document.getElementById(target).classList.add('hidden');
  });
});

document.getElementById('btn-inventory').onclick = () => toggleModal('modal-inventory');
document.getElementById('btn-help').onclick = () => toggleModal('modal-help');

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentBagTab = btn.getAttribute('data-tab');
    renderInventoryModal();
  });
});

function equipItemInstance(uid) {
  const entryIndex = player.inventory.findIndex(i => i.uid === uid);
  if (entryIndex === -1) return;
  const entry = player.inventory[entryIndex];
  const def = ITEM_DB[entry.id];
  if (!def || !def.slot) return;

  if (player.level < (def.levelReq || 1)) {
    showToast(`Requires Hero Level ${def.levelReq} to equip ${def.name}! Fight monsters to level up!`);
    return;
  }

  player.inventory.splice(entryIndex, 1);
  if (player.equipment[def.slot]) {
    player.inventory.push(player.equipment[def.slot]);
  }
  player.equipment[def.slot] = entry;

  SoundFX.coin();
  syncPlayerMaxHp();
  checkQuestCompletion();
  updateHudUI();
  updateHotbarUI();
  renderInventoryModal();
  showToast(`Equipped ${getItemDisplayName(entry)}!`);
}

function unequipSlot(slotName) {
  const current = player.equipment[slotName];
  if (!current) return;
  player.inventory.push(current);
  player.equipment[slotName] = null;
  syncPlayerMaxHp();
  updateHudUI();
  updateHotbarUI();
  renderInventoryModal();
}

function renderInventoryModal() {
  const st = getPlayerStats();

  ['weapon', 'tool', 'helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
    const el = document.getElementById(`slot-${slot}`);
    const eq = player.equipment[slot];
    const contentEl = el.querySelector('.slot-content');
    el.className = 'equip-slot';
    if (eq) {
      const def = ITEM_DB[eq.id];
      el.classList.add(`rarity-${def.rarity}`);
      contentEl.innerHTML = `${def.icon} ${getItemDisplayName(eq)}`;
      el.onclick = () => unequipSlot(slot);
      el.title = 'Click to unequip';
    } else {
      contentEl.textContent = 'Empty';
      el.onclick = null;
    }
  });

  const setBox = document.getElementById('equip-set-info');
  const setDesc = document.getElementById('equip-set-desc');
  if (st.activeSet) {
    setBox.classList.add('active-set');
    setDesc.innerHTML = `<b style="color:${st.activeSet.color}">${st.activeSet.setName} (4/4):</b> ${st.activeSet.setBonusDesc}`;
  } else {
    setBox.classList.remove('active-set');
    setDesc.textContent = 'Equip 4 armor pieces (Helm, Cuirass, Greaves, Sabatons) of the SAME Rarity to activate a powerful Set Bonus!';
  }

  document.getElementById('hero-stats-summary').innerHTML = `
    <div><b>Hero Level:</b> ${player.level}</div>
    <div><b>Max HP:</b> ${st.maxHp}</div>
    <div><b>Attack:</b> ${st.atk}</div>
    <div><b>Defense:</b> ${st.def}</div>
    <div><b>Crit Chance:</b> ${Math.round(st.critChance * 100)}%</div>
    <div><b>HP Regen:</b> +${st.hpRegen}/s</div>
    <div><b>Lifesteal:</b> ${Math.round(st.lifesteal * 100)}%</div>
    <div><b>Pickaxe Tier:</b> ${st.pickPower}</div>
  `;

  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';

  const filtered = player.inventory.filter(entry => {
    const d = ITEM_DB[entry.id];
    if (!d) return false;
    if (currentBagTab === 'all') return true;
    if (currentBagTab === 'consumable') return d.type === 'consumable' || d.type === 'chest';
    return d.type === currentBagTab;
  });

  filtered.forEach(entry => {
    const d = ITEM_DB[entry.id];
    const card = document.createElement('div');
    card.className = `item-card rarity-${d.rarity} ${entry.uid === selectedBagUid ? 'selected' : ''}`;

    let subText = RARITIES[d.rarity].name;
    if (d.type === 'weapon') subText = `+${d.atk} ATK`;
    else if (d.type === 'armor') {
      const aSt = getArmorStats(entry);
      subText = `+${aSt.def} DEF | Lv.${d.levelReq}`;
    } else if (d.type === 'tool') subText = `Power ${d.power}`;
    else if (entry.qty > 1) subText = `Qty: ${entry.qty}`;

    card.innerHTML = `
      <div class="item-card-top">
        <span class="item-icon">${d.icon}</span>
        ${entry.upgrade ? `<span class="item-upgrade-tag">+${entry.upgrade}</span>` : ''}
      </div>
      <div class="item-name">${getItemDisplayName(entry)}</div>
      <div class="item-sub">${subText}</div>
    `;
    card.onclick = () => {
      selectedBagUid = entry.uid;
      renderInventoryModal();
    };
    grid.appendChild(card);
  });

  const detailPanel = document.getElementById('item-detail-panel');
  const selEntry = player.inventory.find(i => i.uid === selectedBagUid);
  if (!selEntry) {
    detailPanel.innerHTML = `<div class="detail-placeholder">Select any item in your backpack to inspect, equip, use, or sell.</div>`;
    return;
  }

  const d = ITEM_DB[selEntry.id];
  const rInfo = RARITIES[d.rarity];
  let statsHtml = `<span class="rarity-tag rarity-${d.rarity}">${rInfo.name}</span>`;
  if (d.type === 'weapon') statsHtml += `<span>Attack: +${d.atk}</span>`;
  if (d.type === 'armor') {
    const aSt = getArmorStats(selEntry);
    const reqColor = player.level >= d.levelReq ? '#4ade80' : '#f87171';
    statsHtml += `<span>Defense: +${aSt.def}</span><span>Max HP: +${aSt.hp}</span><span style="color:${reqColor}">Req Level: ${d.levelReq}</span>`;
  }
  if (d.type === 'tool') statsHtml += `<span>Tier ${d.power} (${d.mineSpeed}x Speed)</span>`;

  const sellVal = d.sellPrice || Math.max(2, Math.floor((d.price || 10) * 0.45 + (selEntry.upgrade || 0) * 15));

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div class="detail-title" style="color:${rInfo.color}">${d.icon} ${getItemDisplayName(selEntry)}</div>
      <div>Sell Value: <b style="color:#fbbf24">${sellVal}g</b></div>
    </div>
    <div class="detail-stats">${statsHtml}</div>
    <div style="color:#cbd5e1; font-size:17px;">${d.desc}</div>
    <div class="detail-actions" id="bag-item-actions"></div>
  `;

  const actContainer = document.getElementById('bag-item-actions');
  if (d.type === 'weapon' || d.type === 'armor' || d.type === 'tool') {
    const btnEq = document.createElement('button');
    btnEq.className = 'pixel-btn action-btn';
    btnEq.textContent = player.level >= (d.levelReq || 1) ? 'Equip Item' : `Requires Lv.${d.levelReq}`;
    btnEq.onclick = () => equipItemInstance(selEntry.uid);
    actContainer.appendChild(btnEq);
  } else if (d.type === 'consumable') {
    const btnUse = document.createElement('button');
    btnUse.className = 'pixel-btn action-btn';
    btnUse.textContent = 'Drink Potion';
    btnUse.onclick = () => useConsumableItem(selEntry.id);
    actContainer.appendChild(btnUse);
  } else if (d.type === 'chest') {
    const btnOpen = document.createElement('button');
    btnOpen.className = 'pixel-btn action-btn';
    btnOpen.textContent = 'Open Loot Chest';
    btnOpen.onclick = () => openMonsterChest(selEntry.id);
    actContainer.appendChild(btnOpen);
  } else if (d.type === 'block') {
    const btnSel = document.createElement('button');
    btnSel.className = 'pixel-btn action-btn';
    btnSel.textContent = 'Select to Place (R-Click)';
    btnSel.onclick = () => {
      player.selectedPlaceBlockId = selEntry.id;
      showToast(`Selected ${d.name} for building!`);
    };
    actContainer.appendChild(btnSel);
  }

  const btnSell = document.createElement('button');
  btnSell.className = 'pixel-btn gold-btn';
  btnSell.textContent = `Sell (+${sellVal}g)`;
  btnSell.onclick = () => {
    player.gold += sellVal;
    SoundFX.coin();
    if (selEntry.qty > 1) {
      selEntry.qty--;
    } else {
      player.inventory = player.inventory.filter(i => i.uid !== selEntry.uid);
      selectedBagUid = null;
    }
    updateHudUI();
    updateHotbarUI();
    renderInventoryModal();
  };
  actContainer.appendChild(btnSell);
}

// ==========================================
// 12. VILLAGE SHOPS & BLACKSMITH (+50)
// ==========================================
function getNearestBuilding() {
  for (const b of BUILDINGS) {
    const npcWorldX = b.npcX * TILE_SIZE;
    const npcWorldY = b.npcY * TILE_SIZE;
    const dist = Math.hypot(player.x - npcWorldX, player.y - npcWorldY);
    if (dist <= 95) return b;
  }
  return null;
}

function tryInteractWithBuilding() {
  const b = getNearestBuilding();
  if (!b) return;

  closeAllModals();
  if (b.shopType === 'blacksmith') {
    document.getElementById('modal-blacksmith').classList.remove('hidden');
    renderBlacksmithModal();
  } else {
    currentShopType = b.shopType;
    selectedShopItemId = null;
    document.getElementById('shop-title').textContent = b.name;
    document.getElementById('shop-greeting').textContent = `${b.npcName}: "${b.greeting}"`;
    document.getElementById('modal-shop').classList.remove('hidden');
    renderShopModal();
  }
}

function getShopCatalog(shopType) {
  if (shopType === 'armory') {
    return Object.values(ITEM_DB).filter(i => i.type === 'weapon' || i.type === 'armor');
  }
  if (shopType === 'relics') {
    return Object.values(ITEM_DB).filter(i => i.type === 'chest' || i.id === 'potion_berserk' || i.id === 'potion_supreme');
  }
  return Object.values(ITEM_DB).filter(
    i => i.type === 'consumable' || i.type === 'tool' || (i.type === 'block' && (i.blockType <= 2 || i.blockType === 8 || i.blockType === 9))
  );
}

function renderShopModal() {
  const catalog = getShopCatalog(currentShopType);
  const grid = document.getElementById('shop-items-grid');
  grid.innerHTML = '';

  catalog.forEach(item => {
    const card = document.createElement('div');
    card.className = `item-card rarity-${item.rarity} ${selectedShopItemId === item.id ? 'selected' : ''}`;

    let statLine = `${item.price}g`;
    if (item.type === 'armor') statLine = `${item.price}g | Lv.${item.levelReq}`;

    card.innerHTML = `
      <div class="item-card-top">
        <span class="item-icon">${item.icon}</span>
        <span class="rarity-tag rarity-${item.rarity}">${item.rarity.slice(0, 3)}</span>
      </div>
      <div class="item-name">${item.name}</div>
      <div class="item-sub" style="color:#fbbf24">${statLine}</div>
    `;
    card.onclick = () => {
      selectedShopItemId = item.id;
      renderShopModal();
    };
    grid.appendChild(card);
  });

  const detailPanel = document.getElementById('shop-detail-panel');
  const sel = ITEM_DB[selectedShopItemId];
  if (!sel) {
    detailPanel.innerHTML = `<div class="detail-placeholder">Select an item on the left to inspect stats and buy with Gold.</div>`;
    return;
  }

  const rInfo = RARITIES[sel.rarity];
  let statsHtml = `<span class="rarity-tag rarity-${sel.rarity}">${rInfo.name}</span>`;
  if (sel.type === 'weapon') statsHtml += `<span>+${sel.atk} ATK</span>`;
  if (sel.type === 'armor') statsHtml += `<span>+${sel.def} DEF</span><span>+${sel.hp} HP</span><span>Req Lv.${sel.levelReq}</span>`;
  if (sel.type === 'tool') statsHtml += `<span>Tier ${sel.power} (${sel.mineSpeed}x Speed)</span>`;
  if (sel.type === 'consumable') statsHtml += `<span>Restores ${sel.heal} HP</span>`;

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div class="detail-title" style="color:${rInfo.color}">${sel.icon} ${sel.name}</div>
      <div style="font-size:22px; color:#fbbf24">${sel.price} Gold</div>
    </div>
    <div class="detail-stats">${statsHtml}</div>
    <div style="color:#cbd5e1; font-size:17px;">${sel.desc}</div>
    <div class="detail-actions">
      <button class="pixel-btn action-btn" id="btn-buy-shop-item">Buy for ${sel.price}g</button>
    </div>
  `;

  document.getElementById('btn-buy-shop-item').onclick = () => {
    if (player.gold < sel.price) {
      showToast(`Not enough Gold! You need ${sel.price}g (You have ${player.gold}g).`);
      return;
    }
    player.gold -= sel.price;
    SoundFX.coin();
    const created = addItemToInventory(sel.id, 1);

    if ((sel.type === 'weapon' || sel.type === 'tool' || sel.type === 'armor') &&
        !player.equipment[sel.slot] &&
        player.level >= (sel.levelReq || 1)) {
      equipItemInstance(created.uid);
    } else {
      showToast(`Purchased ${sel.name}!`);
    }
    checkQuestCompletion();
    updateHudUI();
    updateHotbarUI();
    renderShopModal();
  };
}

document.getElementById('btn-sell-bones').onclick = () => {
  if (player.bones <= 0) {
    showToast('You have no Monster Bones to sell! Slay monsters to collect bones.');
    return;
  }
  const earned = player.bones * 5;
  const count = player.bones;
  player.bones = 0;
  player.gold += earned;
  SoundFX.coin();
  updateHudUI();
  showToast(`Sold ${count} Bones for ${earned} Gold!`);
};

document.getElementById('btn-sell-ores').onclick = () => {
  let totalEarned = 0;
  let totalSold = 0;
  player.inventory = player.inventory.filter(entry => {
    const d = ITEM_DB[entry.id];
    if (d && d.type === 'block' && d.blockType >= 3 && d.blockType !== 8 && d.blockType !== 9) {
      totalEarned += d.sellPrice * entry.qty;
      totalSold += entry.qty;
      return false;
    }
    return true;
  });

  if (totalSold === 0) {
    showToast('No mined Ores in your inventory! Use a Pickaxe to mine Copper, Iron, Gold, Diamond, or Mythril.');
    return;
  }
  player.gold += totalEarned;
  SoundFX.coin();
  updateHudUI();
  updateHotbarUI();
  showToast(`Sold ${totalSold} Mined Ores for ${totalEarned} Gold!`);
};

function getAllPlayerArmorInstances() {
  const list = [];
  ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
    if (player.equipment[slot]) {
      list.push({ instance: player.equipment[slot], equipped: true });
    }
  });
  player.inventory.forEach(entry => {
    const d = ITEM_DB[entry.id];
    if (d && d.type === 'armor') {
      list.push({ instance: entry, equipped: false });
    }
  });
  return list;
}

function renderBlacksmithModal() {
  const listEl = document.getElementById('smith-armor-list');
  const anvilEl = document.getElementById('smith-anvil-panel');
  const armors = getAllPlayerArmorInstances();

  listEl.innerHTML = '';
  if (armors.length === 0) {
    listEl.innerHTML = `<div class="detail-placeholder">You don't own any armor yet! Visit Garrick's Armory across the plaza to buy your first armor piece.</div>`;
    anvilEl.innerHTML = `<div class="detail-placeholder">No armor selected.</div>`;
    return;
  }

  if (!selectedSmithUid || !armors.some(a => a.instance.uid === selectedSmithUid)) {
    selectedSmithUid = armors[0].instance.uid;
  }

  armors.forEach(({ instance, equipped }) => {
    const d = ITEM_DB[instance.id];
    const st = getArmorStats(instance);
    const card = document.createElement('div');
    card.className = `item-card rarity-${d.rarity} ${instance.uid === selectedSmithUid ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="item-card-top">
        <span>${d.icon} <b>${getItemDisplayName(instance)}</b></span>
        <span class="item-upgrade-tag">${equipped ? 'EQUIPPED' : 'BAG'} (${instance.upgrade || 0}/50)</span>
      </div>
      <div class="item-sub">+${st.def} DEF | +${st.hp} Max HP</div>
    `;
    card.onclick = () => {
      selectedSmithUid = instance.uid;
      renderBlacksmithModal();
    };
    listEl.appendChild(card);
  });

  const selObj = armors.find(a => a.instance.uid === selectedSmithUid);
  const inst = selObj.instance;
  const d = ITEM_DB[inst.id];
  const rInfo = RARITIES[d.rarity];
  const curUpg = inst.upgrade || 0;
  const curStats = getArmorStats(inst);

  if (curUpg >= MAX_ARMOR_UPGRADE) {
    anvilEl.innerHTML = `
      <div style="font-size:24px; color:${rInfo.color}">${d.icon} ${getItemDisplayName(inst)}</div>
      <div class="upgrade-preview-box">
        <b>MAXIMUM LEVEL (+50) ACHIEVED!</b><br/>
        Defense: <b>+${curStats.def}</b><br/>
        Bonus Max HP: <b>+${curStats.hp}</b>
      </div>
    `;
    return;
  }

  const nextStats = getArmorStats({ id: inst.id, upgrade: curUpg + 1 });
  const cost = getUpgradeCost(inst);

  anvilEl.innerHTML = `
    <div style="font-size:24px; color:${rInfo.color}">${d.icon} ${getItemDisplayName(inst)}</div>
    <div>Upgrade Level: <b>+${curUpg} -> +${curUpg + 1}</b> (Max +50)</div>
    <div class="upgrade-preview-box">
      <div>Defense: <b>+${curStats.def}</b> -> <b style="color:#4ade80">+${nextStats.def}</b> (+${nextStats.def - curStats.def})</div>
      <div>Max HP: <b>+${curStats.hp}</b> -> <b style="color:#4ade80">+${nextStats.hp}</b> (+${nextStats.hp - curStats.hp})</div>
    </div>
    <div style="font-size:21px; color:#fbbf24">Forge Cost: ${cost} Gold</div>
    <div style="display:flex; gap:8px;">
      <button class="pixel-btn action-btn" id="btn-smith-upgrade-1">Forge +1 (${cost}g)</button>
      <button class="pixel-btn gold-btn" id="btn-smith-upgrade-5">Forge +5</button>
    </div>
  `;

  document.getElementById('btn-smith-upgrade-1').onclick = () => {
    if (player.gold < cost) {
      showToast(`Not enough Gold! Need ${cost}g.`);
      return;
    }
    player.gold -= cost;
    inst.upgrade = curUpg + 1;
    SoundFX.mine();
    syncPlayerMaxHp();
    checkQuestCompletion();
    updateHudUI();
    renderBlacksmithModal();
    showToast(`Upgraded ${d.name} to +${inst.upgrade}!`);
  };

  document.getElementById('btn-smith-upgrade-5').onclick = () => {
    let upgradesDone = 0;
    while ((inst.upgrade || 0) < MAX_ARMOR_UPGRADE && upgradesDone < 5) {
      const stepCost = getUpgradeCost(inst);
      if (player.gold < stepCost) break;
      player.gold -= stepCost;
      inst.upgrade = (inst.upgrade || 0) + 1;
      upgradesDone++;
    }
    if (upgradesDone === 0) {
      showToast('Not enough Gold for the next upgrade!');
    } else {
      SoundFX.levelUp();
      syncPlayerMaxHp();
      checkQuestCompletion();
      updateHudUI();
      renderBlacksmithModal();
      showToast(`Tempered ${d.name} to +${inst.upgrade}!`);
    }
  };
}

// ==========================================
// 13. FLOATING TEXT, PARTICLES & TOASTS
// ==========================================
function spawnFloatingText(x, y, text, color = '#fff', size = 18) {
  floatingTexts.push({ x, y, text, color, size, life: 0.9, maxLife: 0.9 });
}

function spawnParticle(x, y, color, speed = 80) {
  const ang = Math.random() * Math.PI * 2;
  const spd = (0.3 + Math.random() * 0.7) * speed;
  particles.push({
    x,
    y,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    color,
    size: 3 + Math.random() * 4,
    life: 0.35 + Math.random() * 0.25
  });
}

function showToast(msg) {
  const container = document.getElementById('toast-container');
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = msg;
  container.appendChild(div);
  setTimeout(() => {
    div.remove();
  }, 3600);
}

// ==========================================
// 14. MAIN UPDATE LOOP
// ==========================================
let lastTime = performance.now();
let regenAccumulator = 0;

function update(dt) {
  if (actionCooldown > 0) actionCooldown -= dt;
  if (player.swingTimer > 0) player.swingTimer -= dt;
  if (player.dashCd > 0) player.dashCd = Math.max(0, player.dashCd - dt);
  if (player.dashTimer > 0) player.dashTimer -= dt;
  if (player.whirlwindCd > 0) player.whirlwindCd = Math.max(0, player.whirlwindCd - dt);
  if (player.whirlwindTimer > 0) player.whirlwindTimer -= dt;
  if (player.berserkTimer > 0) player.berserkTimer = Math.max(0, player.berserkTimer - dt);
  if (screenShake > 0) screenShake = Math.max(0, screenShake - dt);

  document.getElementById('dash-cd').textContent = player.dashCd > 0 ? `${player.dashCd.toFixed(1)}s` : 'Ready';
  document.getElementById('whirlwind-cd').textContent = player.whirlwindCd > 0 ? `${player.whirlwindCd.toFixed(1)}s` : 'Ready';

  const st = getPlayerStats();
  const ptx = Math.floor(player.x / TILE_SIZE);
  const pty = Math.floor(player.y / TILE_SIZE);
  const currentZone = getZoneAt(ptx, pty);
  document.getElementById('zone-banner').textContent = currentZone.name;
  document.getElementById('coords-text').textContent = `X: ${ptx}, Y: ${pty}`;

  regenAccumulator += dt;
  if (regenAccumulator >= 1.0) {
    regenAccumulator = 0;
    const healAmt = currentZone.safe ? Math.max(10, st.hpRegen + 8) : st.hpRegen;
    if (player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      updateHudUI();
    }
  }

  if (!isAnyModalOpen()) {
    if (player.dashTimer > 0) {
      moveEntityWithCollision(
        player,
        Math.cos(player.dashAngle) * 640 * dt,
        Math.sin(player.dashAngle) * 640 * dt
      );
      spawnParticle(player.x, player.y, '#38bdf8', 40);
    } else {
      let mx = 0, my = 0;
      if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) my += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

      if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my);
        mx /= len;
        my /= len;
        moveEntityWithCollision(player, mx * st.moveSpeed * dt, my * st.moveSpeed * dt);
        player.walkAnim += dt * 11;

        if (player.swingTimer <= 0) {
          if (Math.abs(mx) > Math.abs(my)) player.facing = mx > 0 ? 'right' : 'left';
          else player.facing = my > 0 ? 'down' : 'up';
        }
      } else {
        player.walkAnim = 0;
      }
    }

    if (isLeftMouseDown || keys['Space']) {
      performPrimaryAction();
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const pr = projectiles[i];
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.life -= dt;
    spawnParticle(pr.x, pr.y, pr.color, 35);

    for (let j = monsters.length - 1; j >= 0; j--) {
      const m = monsters[j];
      if (pr.hitSet.has(m.uid)) continue;
      if (Math.hypot(m.x - pr.x, m.y - pr.y) <= m.type.radius + 18) {
        pr.hitSet.add(m.uid);
        damageMonster(m, j, pr.dmg);
      }
    }
    if (pr.life <= 0) projectiles.splice(i, 1);
  }

  const nearBuilding = getNearestBuilding();
  const promptEl = document.getElementById('interact-prompt');
  if (nearBuilding && !isAnyModalOpen()) {
    promptEl.classList.remove('hidden');
    promptEl.innerHTML = `Press <span class="key-badge">F</span> to talk to <b>${nearBuilding.npcName}</b>`;
  } else {
    promptEl.classList.add('hidden');
  }

  let nearestBoss = null;
  let nearestBossDist = 99999;

  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    if (m.hurtTimer > 0) m.hurtTimer -= dt;
    if (m.atkCooldown > 0) m.atkCooldown -= dt;

    const distToPlayer = Math.hypot(player.x - m.x, player.y - m.y);
    if (m.type.isBoss && distToPlayer < 520 && distToPlayer < nearestBossDist) {
      nearestBoss = m;
      nearestBossDist = distToPlayer;
    }

    const mZone = getZoneAt(Math.floor(m.x / TILE_SIZE), Math.floor(m.y / TILE_SIZE));
    if (mZone.safe) {
      const awayAng = Math.atan2(m.y - VILLAGE_CENTER.y * TILE_SIZE, m.x - VILLAGE_CENTER.x * TILE_SIZE);
      moveEntityWithCollision(m, Math.cos(awayAng) * m.type.speed * dt, Math.sin(awayAng) * m.type.speed * dt);
      continue;
    }

    if (!currentZone.safe && distToPlayer < 290) {
      const ang = Math.atan2(player.y - m.y, player.x - m.x);
      moveEntityWithCollision(m, Math.cos(ang) * m.type.speed * dt, Math.sin(ang) * m.type.speed * dt);

      if (distToPlayer <= m.type.radius + player.radius + 8 && m.atkCooldown <= 0 && player.dashTimer <= 0) {
        m.atkCooldown = 1.05;
        const dmg = Math.max(1, Math.round(m.type.atk - st.def * 0.65));
        player.hp -= dmg;
        SoundFX.hit();
        spawnFloatingText(player.x, player.y - 26, `-${dmg} HP`, '#ef4444', 20);
        for (let p = 0; p < 5; p++) spawnParticle(player.x, player.y, '#ef4444', 80);

        if (player.hp <= 0) {
          player.hp = player.maxHp;
          player.x = VILLAGE_CENTER.x * TILE_SIZE;
          player.y = (VILLAGE_CENTER.y - 1) * TILE_SIZE;
          showToast('You were knocked out and rescued back to Oakhaven Village!');
        }
        updateHudUI();
      }
    } else {
      m.wanderTimer -= dt;
      if (m.wanderTimer <= 0) {
        m.wanderTimer = 1.5 + Math.random() * 2.5;
        m.wanderAngle = Math.random() * Math.PI * 2;
      }
      moveEntityWithCollision(
        m,
        Math.cos(m.wanderAngle) * m.type.speed * 0.4 * dt,
        Math.sin(m.wanderAngle) * m.type.speed * 0.4 * dt
      );
    }
  }

  const bossHud = document.getElementById('boss-hud');
  if (nearestBoss) {
    bossHud.classList.remove('hidden');
    document.getElementById('boss-name').textContent = `${nearestBoss.type.name} (Lv.${nearestBoss.type.level})`;
    document.getElementById('boss-bar-fill').style.width = `${Math.max(0, (nearestBoss.hp / nearestBoss.maxHp) * 100)}%`;
    document.getElementById('boss-bar-text').textContent = `${Math.ceil(nearestBoss.hp)} / ${nearestBoss.maxHp} HP`;
  } else {
    bossHud.classList.add('hidden');
  }

  for (let i = groundDrops.length - 1; i >= 0; i--) {
    const d = groundDrops[i];
    if (d.z > 0 || d.vz > 0) {
      d.z += d.vz * dt;
      d.vz -= 380 * dt;
      if (d.z <= 0) {
        d.z = 0;
        d.vz = 0;
      }
    }

    const dist = Math.hypot(player.x - d.x, player.y - d.y);
    if (dist < 105) {
      const pull = (110 - dist) * 5.0 * dt;
      const ang = Math.atan2(player.y - d.y, player.x - d.x);
      d.x += Math.cos(ang) * pull;
      d.y += Math.sin(ang) * pull;
    }

    if (dist < 28) {
      SoundFX.coin();
      if (d.type === 'gold') {
        player.gold += d.amount;
        spawnFloatingText(player.x, player.y - 24, `+${d.amount} Gold`, '#fbbf24', 18);
      } else if (d.type === 'bone') {
        player.bones += d.amount;
        spawnFloatingText(player.x, player.y - 24, `+${d.amount} Bone`, '#e2e8f0', 18);
      } else if (d.type === 'chest') {
        const cDef = ITEM_DB[d.chestId];
        addItemToInventory(d.chestId, 1);
        spawnFloatingText(player.x, player.y - 34, `+1 ${cDef.name}!`, RARITIES[cDef.rarity].color, 21);
      }
      groundDrops.splice(i, 1);
      updateHudUI();
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 32 * dt;
    ft.life -= dt;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
}

// ==========================================
// 15. POKEMON-STYLE 2.5D PIXEL ART RENDERER & MINIMAP
// ==========================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawGroundTiles(camX, camY) {
  const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
  const endTx = Math.min(MAP_W - 1, Math.ceil((camX + canvas.width) / TILE_SIZE) + 1);
  const startTy = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
  const endTy = Math.min(MAP_H - 1, Math.ceil((camY + canvas.height) / TILE_SIZE) + 1);

  for (let ty = startTy; ty <= endTy; ty++) {
    for (let tx = startTx; tx <= endTx; tx++) {
      const g = worldGround[idx(tx, ty)];
      const sx = tx * TILE_SIZE - camX;
      const sy = ty * TILE_SIZE - camY;
      const checker = (tx + ty) % 2 === 0;

      if (g === GROUND.GRASS) {
        ctx.fillStyle = checker ? '#3b7a3e' : '#356f38';
      } else if (g === GROUND.PLAZA) {
        ctx.fillStyle = checker ? '#9ca3af' : '#8b93a1';
      } else if (g === GROUND.PATH) {
        ctx.fillStyle = checker ? '#b89768' : '#ab8b5d';
      } else if (g === GROUND.FOREST) {
        ctx.fillStyle = checker ? '#2d5a36' : '#274f2f';
      } else if (g === GROUND.DESERT) {
        ctx.fillStyle = checker ? '#d9a05b' : '#cc9450';
      } else if (g === GROUND.TUNDRA) {
        ctx.fillStyle = checker ? '#cbd5e1' : '#b8c4d4';
      } else if (g === GROUND.QUARRY) {
        ctx.fillStyle = checker ? '#475569' : '#3f4c5e';
      } else if (g === GROUND.SHADOW) {
        ctx.fillStyle = checker ? '#2e1f47' : '#26193b';
      } else if (g === GROUND.VOLCANIC) {
        ctx.fillStyle = checker ? '#451a1c' : '#3b1517';
      } else {
        ctx.fillStyle = '#1e3a8a';
      }

      ctx.fillRect(sx, sy, TILE_SIZE + 1, TILE_SIZE + 1);

      const hash = (tx * 19 + ty * 31) % 9;
      if (g === GROUND.PLAZA) {
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        ctx.strokeRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if ((g === GROUND.GRASS || g === GROUND.FOREST) && hash === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.fillRect(sx + 12, sy + 14, 4, 8);
        ctx.fillRect(sx + 18, sy + 18, 4, 6);
      } else if (g === GROUND.VOLCANIC && hash === 1) {
        ctx.fillStyle = '#f97316';
        ctx.fillRect(sx + 16, sy + 20, 10, 4);
      }
    }
  }
}

function draw25DBlock(tx, ty, blk, camX, camY) {
  const bDef = BLOCK_BY_TYPE[blk.type];
  const sx = tx * TILE_SIZE - camX;
  const sy = ty * TILE_SIZE - camY;
  const wallH = 22;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.fillRect(sx + 4, sy + 6, TILE_SIZE, TILE_SIZE - 2);

  ctx.fillStyle = bDef.sideColor;
  ctx.fillRect(sx, sy + TILE_SIZE - wallH, TILE_SIZE, wallH);

  ctx.fillStyle = bDef.topColor;
  ctx.fillRect(sx, sy - wallH, TILE_SIZE, TILE_SIZE);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 1, sy - wallH + 1, TILE_SIZE - 2, TILE_SIZE - 2);

  if (bDef.speckle) {
    ctx.fillStyle = bDef.speckle;
    ctx.fillRect(sx + 10, sy - wallH + 12, 8, 8);
    ctx.fillRect(sx + 28, sy - wallH + 22, 9, 7);
    ctx.fillRect(sx + 16, sy - wallH + 32, 7, 7);
    ctx.fillRect(sx + 14, sy + TILE_SIZE - wallH + 6, 7, 7);
    ctx.fillRect(sx + 30, sy + TILE_SIZE - wallH + 9, 6, 6);
  }

  if (blk.hp < blk.maxHp) {
    const ratio = 1 - blk.hp / blk.maxHp;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.48 * ratio})`;
    ctx.fillRect(sx + 8, sy - wallH + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  }
}

function draw25DBuilding(b, camX, camY) {
  const sx = b.tx * TILE_SIZE - camX;
  const sy = b.ty * TILE_SIZE - camY;
  const w = b.tw * TILE_SIZE;
  const h = b.th * TILE_SIZE;
  const wallHeight = 54;
  const roofHeight = 58;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(sx + 8, sy + 10, w, h);

  ctx.fillStyle = b.wallColor;
  ctx.fillRect(sx, sy + h - wallHeight, w, wallHeight);

  ctx.fillStyle = b.trimColor;
  ctx.fillRect(sx, sy + h - wallHeight, 8, wallHeight);
  ctx.fillRect(sx + w - 8, sy + h - wallHeight, 8, wallHeight);
  ctx.fillRect(sx, sy + h - 8, w, 8);

  const doorW = 36, doorH = 38;
  const doorX = sx + w / 2 - doorW / 2;
  const doorY = sy + h - doorH;
  ctx.fillStyle = '#451a03';
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(doorX, doorY, doorW, doorH);

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(sx + 24, sy + h - wallHeight + 14, 28, 22);
  ctx.fillRect(sx + w - 52, sy + h - wallHeight + 14, 28, 22);
  ctx.strokeStyle = b.trimColor;
  ctx.strokeRect(sx + 24, sy + h - wallHeight + 14, 28, 22);
  ctx.strokeRect(sx + w - 52, sy + h - wallHeight + 14, 28, 22);

  ctx.fillStyle = b.roofDark;
  ctx.fillRect(sx - 6, sy - roofHeight, w + 12, h - wallHeight + roofHeight);

  ctx.fillStyle = b.roofColor;
  ctx.fillRect(sx - 4, sy - roofHeight + 6, w + 8, h - wallHeight + roofHeight - 14);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let ry = sy - roofHeight + 14; ry < sy + h - wallHeight - 6; ry += 12) {
    ctx.fillRect(sx, ry, w, 3);
  }

  // Signboard with real pixel-art icon!
  const signW = 210, signH = 24;
  const signX = sx + w / 2 - signW / 2;
  const signY = sy - roofHeight - 28;
  ctx.fillStyle = 'rgba(15, 12, 24, 0.9)';
  ctx.fillRect(signX, signY, signW, signH);
  ctx.strokeStyle = '#fbbf24';
  ctx.strokeRect(signX, signY, signW, signH);

  const iconCan = SpriteEngine.getIconCanvas(b.signIconKind || 'sword', '#fbbf24', '#ffffff');
  ctx.drawImage(iconCan, signX + 6, signY + 2, 20, 20);

  ctx.font = 'bold 16px VT323, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(b.name.split('(')[0].trim(), signX + 32, signY + 17);
}

// Grounded NPC Renderer: Shadow sits directly beneath the bottom-aligned boots!
function drawShopNPC(b, camX, camY) {
  const nx = Math.round(b.npcX * TILE_SIZE - camX);
  const ny = Math.round(b.npcY * TILE_SIZE - camY);

  // Ground shadow directly under feet at (nx, ny - 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(nx, ny - 2, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const spr = SpriteEngine.getCharacterSprite({
    facing: 'down',
    frame: 0,
    helmColor: b.npcHelm,
    chestColor: b.npcColor,
    chestDark: '#1e293b',
    legsColor: '#334155',
    bootsColor: '#0f172a'
  });
  // Since spr is exact bottom-aligned, drawing at ny - spr.height places the boots directly on ny!
  ctx.drawImage(spr, Math.round(nx - spr.width / 2), ny - spr.height);

  ctx.font = '16px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(b.npcName, nx + 1, ny - spr.height - 5);
  ctx.fillStyle = '#fde047';
  ctx.fillText(b.npcName, nx, ny - spr.height - 6);
}

function drawWorldProp(prop, camX, camY) {
  const sx = Math.round((prop.tx + 0.5) * TILE_SIZE - camX);
  const sy = Math.round((prop.ty + 0.85) * TILE_SIZE - camY);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(sx, sy - 2, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const spr = SpriteEngine.getPropSprite(prop.type);
  ctx.drawImage(spr, Math.round(sx - spr.width / 2), sy - spr.height);
}

function drawMonster(m, camX, camY) {
  const sx = Math.round(m.x - camX);
  const sy = Math.round(m.y - camY);
  const r = m.type.radius;
  const animFrame = Math.floor(performance.now() / 280 + m.uid * 10) % 2;
  const bounce = animFrame === 1 ? 3 : 0;

  // Ground shadow directly under monster base at (sx, sy - 2)
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(sx, sy - 2, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  if (m.type.isBoss) {
    ctx.strokeStyle = '#ff3e6c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 2, r + 10, (r + 10) * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const spr = SpriteEngine.getMonsterSprite(
    m.type.species || 'slime',
    m.type.color,
    m.type.secColor || m.type.color,
    m.type.eyeColor,
    animFrame,
    m.hurtTimer > 0
  );

  const scaleMult = m.type.isBoss ? 1.45 : 1.0;
  const dw = Math.round(spr.width * scaleMult);
  const dh = Math.round(spr.height * scaleMult);
  ctx.drawImage(spr, Math.round(sx - dw / 2), sy - dh - bounce, dw, dh);

  ctx.font = '15px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(`Lv.${m.type.level} ${m.type.name}`, sx + 1, sy - dh - 10 - bounce);
  ctx.fillStyle = m.type.isBoss ? '#ff3e6c' : '#fde68a';
  ctx.fillText(`Lv.${m.type.level} ${m.type.name}`, sx, sy - dh - 11 - bounce);

  const barW = Math.max(42, r * 2.5);
  ctx.fillStyle = '#1e1b2e';
  ctx.fillRect(sx - barW / 2, sy - dh - 7 - bounce, barW, 6);
  ctx.fillStyle = m.type.isBoss ? '#ff3e6c' : '#ef4444';
  ctx.fillRect(sx - barW / 2, sy - dh - 7 - bounce, barW * Math.max(0, m.hp / m.maxHp), 6);
}

// Grounded Player Renderer: Shadow sits directly beneath the bottom-aligned boots!
function drawPlayer(camX, camY) {
  const sx = Math.round(player.x - camX);
  const sy = Math.round(player.y - camY);
  const st = getPlayerStats();

  if (st.activeSet) {
    ctx.strokeStyle = st.activeSet.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 2, 20, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.whirlwindTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(sx, sy - 16, 110 * (1 - player.whirlwindTimer / 0.36), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Ground shadow directly under player's boots at (sx, sy - 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(sx, sy - 2, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const walkFrame = player.walkAnim === 0 ? 0 : (Math.floor(player.walkAnim) % 2) + 1;
  const helmColor = player.equipment.helmet ? RARITIES[ITEM_DB[player.equipment.helmet.id].rarity].color : null;
  const chestColor = player.equipment.chestplate ? RARITIES[ITEM_DB[player.equipment.chestplate.id].rarity].color : '#3b82f6';
  const chestDark = player.equipment.chestplate ? RARITIES[ITEM_DB[player.equipment.chestplate.id].rarity].darkColor : '#1d4ed8';
  const legsColor = player.equipment.leggings ? RARITIES[ITEM_DB[player.equipment.leggings.id].rarity].color : '#1e3a8a';
  const bootsColor = player.equipment.boots ? RARITIES[ITEM_DB[player.equipment.boots.id].rarity].darkColor : '#451a03';
  const wingsColor = st.activeSet?.setBonus?.wings || null;

  const spr = SpriteEngine.getCharacterSprite({
    facing: player.facing,
    frame: walkFrame,
    helmColor,
    chestColor,
    chestDark,
    legsColor,
    bootsColor,
    wingsColor
  });

  // Boots are at exact bottom of spr, so sy - spr.height puts boots right on sy!
  ctx.drawImage(spr, Math.round(sx - spr.width / 2), sy - spr.height);

  if (player.swingTimer > 0) {
    const progress = 1 - player.swingTimer / 0.22;
    const startAng = player.swingAngle - 1.05;
    const curAng = startAng + progress * 2.1;

    let swingColor = '#e2e8f0';
    if (player.equipment.weapon) {
      swingColor = ITEM_DB[player.equipment.weapon.id].bladeColor || '#fbbf24';
    } else if (player.equipment.tool) {
      swingColor = ITEM_DB[player.equipment.tool.id].headColor || '#38bdf8';
    }

    ctx.save();
    ctx.strokeStyle = swingColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(sx, sy - 18, 46, startAng, curAng);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx, sy - 18);
    ctx.lineTo(sx + Math.cos(curAng) * 52, sy - 18 + Math.sin(curAng) * 52);
    ctx.stroke();
    ctx.restore();
  }
}

function renderMinimap() {
  miniCtx.fillStyle = '#0f172a';
  miniCtx.fillRect(0, 0, 144, 144);

  const scale = 144 / MAP_W;
  for (let ty = 0; ty < MAP_H; ty += 2) {
    for (let tx = 0; tx < MAP_W; tx += 2) {
      const g = worldGround[idx(tx, ty)];
      if (g === GROUND.PLAZA || g === GROUND.GRASS) miniCtx.fillStyle = '#4ade80';
      else if (g === GROUND.PATH) miniCtx.fillStyle = '#d6d3d1';
      else if (g === GROUND.TUNDRA) miniCtx.fillStyle = '#e0f2fe';
      else if (g === GROUND.QUARRY) miniCtx.fillStyle = '#64748b';
      else if (g === GROUND.DESERT) miniCtx.fillStyle = '#f59e0b';
      else if (g === GROUND.SHADOW) miniCtx.fillStyle = '#6b21a8';
      else if (g === GROUND.VOLCANIC) miniCtx.fillStyle = '#991b1b';
      else miniCtx.fillStyle = '#166534';
      miniCtx.fillRect(tx * scale, ty * scale, 2, 2);
    }
  }

  monsters.forEach(m => {
    if (m.type.isBoss) {
      miniCtx.fillStyle = '#ff3e6c';
      miniCtx.fillRect((m.x / TILE_SIZE) * scale - 2, (m.y / TILE_SIZE) * scale - 2, 5, 5);
    }
  });

  miniCtx.fillStyle = '#fde047';
  miniCtx.fillRect((player.x / TILE_SIZE) * scale - 2, (player.y / TILE_SIZE) * scale - 2, 5, 5);
}

let minimapTimer = 0;

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * 10 : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * 10 : 0;
  const camX = Math.round(player.x - canvas.width / 2 + shakeX);
  const camY = Math.round(player.y - canvas.height / 2 + shakeY);
  mouseWorldX = mouseScreenX + camX;
  mouseWorldY = mouseScreenY + camY;

  drawGroundTiles(camX, camY);

  if (!isAnyModalOpen()) {
    const { tx, ty } = getTargetTileFromCursor();
    const dist = Math.hypot((tx + 0.5) * TILE_SIZE - player.x, (ty + 0.5) * TILE_SIZE - player.y);
    if (dist <= TILE_SIZE * 3.4) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx * TILE_SIZE - camX, ty * TILE_SIZE - camY, TILE_SIZE, TILE_SIZE);
    }
  }

  const renderList = [];
  const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - 2);
  const endTx = Math.min(MAP_W - 1, Math.ceil((camX + canvas.width) / TILE_SIZE) + 2);
  const startTy = Math.max(0, Math.floor(camY / TILE_SIZE) - 2);
  const endTy = Math.min(MAP_H - 1, Math.ceil((camY + canvas.height) / TILE_SIZE) + 2);

  for (let ty = startTy; ty <= endTy; ty++) {
    for (let tx = startTx; tx <= endTx; tx++) {
      const blk = worldBlocks[idx(tx, ty)];
      if (blk) {
        renderList.push({
          sortY: (ty + 1) * TILE_SIZE,
          draw: () => draw25DBlock(tx, ty, blk, camX, camY)
        });
      }
    }
  }

  BUILDINGS.forEach(b => {
    renderList.push({
      sortY: (b.ty + b.th) * TILE_SIZE,
      draw: () => draw25DBuilding(b, camX, camY)
    });
    renderList.push({
      sortY: b.npcY * TILE_SIZE,
      draw: () => drawShopNPC(b, camX, camY)
    });
  });

  worldProps.forEach(prop => {
    if (prop.tx >= startTx && prop.tx <= endTx && prop.ty >= startTy && prop.ty <= endTy) {
      renderList.push({
        sortY: (prop.ty + 0.85) * TILE_SIZE,
        draw: () => drawWorldProp(prop, camX, camY)
      });
    }
  });

  // Ground drops rendered with real pixel-art sprites & grounded shadows!
  groundDrops.forEach(d => {
    renderList.push({
      sortY: d.y,
      draw: () => {
        const sx = Math.round(d.x - camX);
        const sy = Math.round(d.y - camY);
        const zOff = Math.round(d.z || 0);

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(sx, sy - 2, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        let iconCan;
        if (d.type === 'gold') {
          iconCan = SpriteEngine.getIconCanvas('coin', '#fbbf24', '#f59e0b');
        } else if (d.type === 'bone') {
          iconCan = SpriteEngine.getIconCanvas('bone', '#e2e8f0', '#94a3b8');
        } else {
          const cDef = ITEM_DB[d.chestId];
          const rColor = cDef ? RARITIES[cDef.rarity].color : '#fbbf24';
          iconCan = SpriteEngine.getIconCanvas('chest', rColor, '#fbbf24');
        }
        ctx.drawImage(iconCan, sx - 12, sy - 24 - zOff, 24, 24);
      }
    });
  });

  monsters.forEach(m => {
    if (m.x + 120 >= camX && m.x - 120 <= camX + canvas.width &&
        m.y + 120 >= camY && m.y - 120 <= camY + canvas.height) {
      renderList.push({
        sortY: m.y,
        draw: () => drawMonster(m, camX, camY)
      });
    }
  });

  renderList.push({
    sortY: player.y,
    draw: () => drawPlayer(camX, camY)
  });

  renderList.sort((a, b) => a.sortY - b.sortY);
  renderList.forEach(item => item.draw());

  projectiles.forEach(pr => {
    ctx.save();
    ctx.translate(pr.x - camX, pr.y - camY);
    ctx.rotate(pr.angle);
    ctx.strokeStyle = pr.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -0.9, 0.9);
    ctx.stroke();
    ctx.restore();
  });

  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - camX - p.size / 2, p.y - camY - p.size / 2, p.size, p.size);
  });

  floatingTexts.forEach(ft => {
    ctx.font = `bold ${ft.size}px VT323, monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(ft.text, ft.x - camX + 2, ft.y - camY + 2);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x - camX, ft.y - camY);
  });

  minimapTimer++;
  if (minimapTimer % 10 === 0) {
    renderMinimap();
  }
}

function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

generateWorld();
populateInitialMonsters();
checkQuestCompletion();
updateHudUI();
updateHotbarUI();
renderMinimap();
showToast('Welcome to Oakhaven Village! Spend your 100 Gold at the 4 shops [F] and begin your quest!');
requestAnimationFrame(gameLoop);
