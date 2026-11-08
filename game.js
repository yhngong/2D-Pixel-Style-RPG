/**
 * VALORIA: 2.5D PIXEL RPG
 * Features:
 * - Pokemon Gen-3/4/5 style 2.5D Oblique Top-Down Perspective (3D building facades, cliff faces, volumetric blocks, depth sorting)
 * - Village spawn with 100 Gold, Weapon/Armor Shop, Tool/Potion Shop, and Master Blacksmith (+1 to +50 Armor Upgrades)
 * - 6 Rarity Tiers: Common, Uncommon, Rare, Epic, Legendary, Mythic
 * - Full-Set Armor Bonuses (4/4 matching rarity) + Hero Level Requirements for Armor
 * - Mining Ores with Pickaxe & Placing Blocks in the 2.5D world
 * - Monsters across 5 Biomes dropping Gold, Bones, and Difficulty-Scaled Loot Chests
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

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
    multiplier: 1.0,
    setName: 'Militia Ironclad Set',
    setBonusDesc: '+20 Max HP, +3 Defense',
    setBonus: { maxHp: 20, def: 3, atkMult: 0, speedMult: 0, critChance: 0, regen: 0, lifesteal: 0 }
  },
  uncommon: {
    id: 'uncommon',
    name: 'Uncommon',
    color: '#4ade80',
    darkColor: '#16a34a',
    levelReq: 3,
    multiplier: 1.7,
    setName: 'Ranger Vanguard Set',
    setBonusDesc: '+45 Max HP, +12% Move Speed, +5 Attack',
    setBonus: { maxHp: 45, def: 5, atk: 5, atkMult: 0, speedMult: 0.12, critChance: 0.05, regen: 1, lifesteal: 0 }
  },
  rare: {
    id: 'rare',
    name: 'Rare',
    color: '#38bdf8',
    darkColor: '#0284c7',
    levelReq: 6,
    multiplier: 2.8,
    setName: 'Cobalt Knight Set',
    setBonusDesc: '+90 Max HP, +15% Attack Damage, +4 HP/s Regen',
    setBonus: { maxHp: 90, def: 10, atk: 10, atkMult: 0.15, speedMult: 0.15, critChance: 0.10, regen: 4, lifesteal: 0 }
  },
  epic: {
    id: 'epic',
    name: 'Epic',
    color: '#c084fc',
    darkColor: '#7e22ce',
    levelReq: 10,
    multiplier: 4.6,
    setName: 'Voidwalker Warlord Set',
    setBonusDesc: '+180 Max HP, +25% Damage, +18% Crit Chance, 10% Lifesteal',
    setBonus: { maxHp: 180, def: 20, atk: 22, atkMult: 0.25, speedMult: 0.20, critChance: 0.18, regen: 7, lifesteal: 0.10 }
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    color: '#fbbf24',
    darkColor: '#d97706',
    levelReq: 15,
    multiplier: 7.5,
    setName: 'Sunforged Paladin Set',
    setBonusDesc: '+350 Max HP, +40% Damage, +28% Crit Chance, +16 HP/s Regen',
    setBonus: { maxHp: 350, def: 38, atk: 45, atkMult: 0.40, speedMult: 0.25, critChance: 0.28, regen: 16, lifesteal: 0.15 }
  },
  mythic: {
    id: 'mythic',
    name: 'Mythic',
    color: '#ff3e6c',
    darkColor: '#be123c',
    levelReq: 20,
    multiplier: 12.5,
    setName: 'Celestial Dragonlord Set',
    setBonusDesc: '+700 Max HP, +75% Damage, +40% Crit, 25% Lifesteal & Mythic Aura!',
    setBonus: { maxHp: 700, def: 75, atk: 95, atkMult: 0.75, speedMult: 0.35, critChance: 0.40, regen: 32, lifesteal: 0.25 }
  }
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// ==========================================
// 2. ITEM CATALOG GENERATOR
// ==========================================
const ITEM_DB = {};

function registerItem(item) {
  ITEM_DB[item.id] = item;
}

// Weapons across all 6 rarities
const WEAPON_TEMPLATES = [
  { rarity: 'common', id: 'sword_common', name: 'Rusty Shortsword', icon: '🗡️', atk: 7, price: 25, bladeColor: '#cbd5e1' },
  { rarity: 'common', id: 'axe_common', name: 'Militia Broadsword', icon: '⚔️', atk: 11, price: 45, bladeColor: '#94a3b8' },
  { rarity: 'uncommon', id: 'sword_uncommon', name: 'Bronze Gladius', icon: '🗡️', atk: 19, price: 110, bladeColor: '#4ade80' },
  { rarity: 'uncommon', id: 'claymore_uncommon', name: 'Verdant Claymore', icon: '⚔️', atk: 26, price: 185, bladeColor: '#22c55e' },
  { rarity: 'rare', id: 'sword_rare', name: 'Cobalt Katana', icon: '🗡️', atk: 42, price: 380, bladeColor: '#38bdf8' },
  { rarity: 'rare', id: 'halberd_rare', name: 'Frostbite Greatsword', icon: '⚔️', atk: 55, price: 560, bladeColor: '#0ea5e9' },
  { rarity: 'epic', id: 'sword_epic', name: 'Obsidian Voidblade', icon: '🗡️', atk: 90, price: 1250, bladeColor: '#c084fc' },
  { rarity: 'epic', id: 'reaver_epic', name: 'Nightfall Reaver', icon: '⚔️', atk: 115, price: 1750, bladeColor: '#a855f7' },
  { rarity: 'legendary', id: 'sword_legendary', name: 'Solaris Excalibur', icon: '🗡️', atk: 185, price: 4200, bladeColor: '#fbbf24' },
  { rarity: 'mythic', id: 'sword_mythic', name: 'Astral Godslayer', icon: '⚔️', atk: 360, price: 12000, bladeColor: '#ff3e6c' }
];

WEAPON_TEMPLATES.forEach(w => {
  registerItem({
    ...w,
    type: 'weapon',
    slot: 'weapon',
    levelReq: 1,
    desc: `A ${RARITIES[w.rarity].name} weapon granting +${w.atk} Attack Power.`
  });
});

// Pickaxes across all 6 rarities
const PICKAXE_TEMPLATES = [
  { rarity: 'common', id: 'pick_common', name: 'Wooden Pickaxe', icon: '⛏️', power: 1, mineSpeed: 1.0, price: 20, headColor: '#a16207' },
  { rarity: 'uncommon', id: 'pick_uncommon', name: 'Copper Pickaxe', icon: '⛏️', power: 2, mineSpeed: 1.4, price: 95, headColor: '#4ade80' },
  { rarity: 'rare', id: 'pick_rare', name: 'Cobalt Pickaxe', icon: '⛏️', power: 3, mineSpeed: 1.9, price: 320, headColor: '#38bdf8' },
  { rarity: 'epic', id: 'pick_epic', name: 'Amethyst Pickaxe', icon: '⛏️', power: 4, mineSpeed: 2.6, price: 980, headColor: '#c084fc' },
  { rarity: 'legendary', id: 'pick_legendary', name: 'Sunfire Pickaxe', icon: '⛏️', power: 5, mineSpeed: 3.6, price: 2900, headColor: '#fbbf24' },
  { rarity: 'mythic', id: 'pick_mythic', name: 'Worldbreaker Pickaxe', icon: '⛏️', power: 6, mineSpeed: 5.2, price: 8500, headColor: '#ff3e6c' }
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

// Armor sets (Helmet, Chestplate, Leggings, Boots) across all 6 rarities
const ARMOR_PREFIXES = {
  common: { prefix: 'Leather', baseDef: 2, baseHp: 8, basePrice: 20 },
  uncommon: { prefix: 'Chainmail', baseDef: 5, baseHp: 18, basePrice: 85 },
  rare: { prefix: 'Cobalt Plate', baseDef: 10, baseHp: 38, basePrice: 270 },
  epic: { prefix: 'Shadowsteel', baseDef: 19, baseHp: 75, basePrice: 850 },
  legendary: { prefix: 'Dragonscale', baseDef: 34, baseHp: 145, basePrice: 2600 },
  mythic: { prefix: 'Celestial', baseDef: 62, baseHp: 280, basePrice: 7800 }
};

const ARMOR_SLOTS = [
  { slot: 'helmet', label: 'Helm', icon: '🪖', defWeight: 0.9, hpWeight: 0.9, priceWeight: 0.9 },
  { slot: 'chestplate', label: 'Cuirass', icon: '🦺', defWeight: 1.35, hpWeight: 1.35, priceWeight: 1.25 },
  { slot: 'leggings', label: 'Greaves', icon: '👖', defWeight: 1.05, hpWeight: 1.05, priceWeight: 1.0 },
  { slot: 'boots', label: 'Sabatons', icon: '🥾', defWeight: 0.75, hpWeight: 0.75, priceWeight: 0.85 }
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
      icon: s.icon,
      def,
      hp,
      price,
      levelReq: rInfo.levelReq,
      desc: `Requires Hero Lv.${rInfo.levelReq}. Part of the ${rInfo.setName}. Can be upgraded up to +50 at the Blacksmith!`
    });
  });
});

// Potions & Consumables
const CONSUMABLES = [
  { id: 'potion_small', name: 'Minor Health Potion', rarity: 'common', type: 'consumable', icon: '🧪', heal: 55, price: 15, desc: 'Restores 55 HP instantly.' },
  { id: 'potion_medium', name: 'Greater Health Potion', rarity: 'uncommon', type: 'consumable', icon: '⚗️', heal: 160, price: 50, desc: 'Restores 160 HP instantly.' },
  { id: 'potion_large', name: 'Superior Elixir', rarity: 'rare', type: 'consumable', icon: '🍷', heal: 420, price: 150, desc: 'Restores 420 HP instantly.' },
  { id: 'potion_supreme', name: 'Phoenix Nectar', rarity: 'epic', type: 'consumable', icon: '🍯', heal: 1200, price: 450, desc: 'Restores 1,200 HP instantly.' },
  // Monster Drop Chests (Tiered 1 to 6)
  { id: 'chest_tier_1', name: 'Wooden Monster Chest', rarity: 'common', type: 'chest', chestTier: 1, icon: '📦', price: 60, desc: 'Dropped by Lv.1-3 monsters. Open to receive random Common-Uncommon gear & gold!' },
  { id: 'chest_tier_2', name: 'Reinforced Iron Chest', rarity: 'uncommon', type: 'chest', chestTier: 2, icon: '🧰', price: 160, desc: 'Dropped by Forest monsters. Contains Uncommon-Rare weapons or armor!' },
  { id: 'chest_tier_3', name: 'Runed Cobalt Chest', rarity: 'rare', type: 'chest', chestTier: 3, icon: '🎁', price: 420, desc: 'Dropped by Quarry & Golem foes. High chance for Rare & Epic gear!' },
  { id: 'chest_tier_4', name: 'Cursed Obsidian Chest', rarity: 'epic', type: 'chest', chestTier: 4, icon: '🔮', price: 1100, desc: 'Dropped by Shadowlands monsters. Contains Epic or Legendary equipment!' },
  { id: 'chest_tier_5', name: 'Golden Dragon Hoard', rarity: 'legendary', type: 'chest', chestTier: 5, icon: '👑', price: 3000, desc: 'Dropped by Volcanic Titans. Contains Legendary or Mythic relics!' },
  { id: 'chest_tier_6', name: 'Mythic Abyssal Reliquary', rarity: 'mythic', type: 'chest', chestTier: 6, icon: '🌟', price: 8000, desc: 'Dropped by the Abyssal Dragon Boss! Guaranteed Legendary/Mythic gear & huge Gold!' }
];

CONSUMABLES.forEach(registerItem);

// Mineable & Placeable Blocks / Ores
const BLOCK_ITEMS = [
  { id: 'block_wood', name: 'Wood Planks Block', rarity: 'common', type: 'block', blockType: 1, icon: '🪵', price: 5, sellPrice: 2, reqPower: 1, blockHp: 25, topColor: '#b47b44', sideColor: '#7c4d25', desc: 'Sturdy wooden construction block. Right-click to place in the world!' },
  { id: 'block_stone', name: 'Cobblestone Block', rarity: 'common', type: 'block', blockType: 2, icon: '🪨', price: 6, sellPrice: 3, reqPower: 1, blockHp: 35, topColor: '#94a3b8', sideColor: '#475569', desc: 'Solid stone wall block. Place to build forts or barriers!' },
  { id: 'block_copper', name: 'Copper Ore Block', rarity: 'uncommon', type: 'block', blockType: 3, icon: '🟠', price: 24, sellPrice: 12, reqPower: 1, blockHp: 50, topColor: '#d97706', sideColor: '#78350f', speckle: '#34d399', desc: 'Uncommon ore. Sell at any shop for 12 Gold or place as a block!' },
  { id: 'block_iron', name: 'Iron Ore Block', rarity: 'rare', type: 'block', blockType: 4, icon: '🔩', price: 55, sellPrice: 28, reqPower: 2, blockHp: 85, topColor: '#60a5fa', sideColor: '#1e3a8a', speckle: '#e0f2fe', desc: 'Rare metallic ore. Requires Copper Pickaxe+. Sells for 28 Gold!' },
  { id: 'block_gold', name: 'Gold Ore Block', rarity: 'epic', type: 'block', blockType: 5, icon: '🪙', price: 120, sellPrice: 65, reqPower: 3, blockHp: 140, topColor: '#facc15', sideColor: '#854d0e', speckle: '#fef08a', desc: 'Rich Gold vein! Requires Cobalt Pickaxe+. Sells for 65 Gold!' },
  { id: 'block_mythril', name: 'Mythril Crystal Block', rarity: 'legendary', type: 'block', blockType: 6, icon: '💎', price: 280, sellPrice: 150, reqPower: 4, blockHp: 220, topColor: '#38bdf8', sideColor: '#0369a1', speckle: '#f0abfc', desc: 'Shimmering Legendary crystal! Sells for 150 Gold or builds radiant walls.' },
  { id: 'block_celestite', name: 'Celestite Core Block', rarity: 'mythic', type: 'block', blockType: 7, icon: '🌌', price: 650, sellPrice: 360, reqPower: 5, blockHp: 340, topColor: '#f43f5e', sideColor: '#881337', speckle: '#fde047', desc: 'Mythic star-forged ore! Sells for 360 Gold each.' }
];

const BLOCK_BY_TYPE = {};
BLOCK_ITEMS.forEach(b => {
  registerItem(b);
  BLOCK_BY_TYPE[b.blockType] = b;
});

// ==========================================
// 3. ARMOR UPGRADE MATH (+1 to +50)
// ==========================================
const MAX_ARMOR_UPGRADE = 50;

function getArmorStats(itemInstance) {
  const base = ITEM_DB[itemInstance.id];
  if (!base || base.type !== 'armor') return { def: 0, hp: 0 };
  const upg = itemInstance.upgrade || 0;
  // Each upgrade up to +50 adds +12% base + flat scaling so +50 feels truly godly
  const def = Math.round(base.def * (1 + upg * 0.14) + upg * 1.5);
  const hp = Math.round(base.hp * (1 + upg * 0.14) + upg * 6);
  return { def, hp };
}

function getUpgradeCost(itemInstance) {
  const base = ITEM_DB[itemInstance.id];
  const nextLevel = (itemInstance.upgrade || 0) + 1;
  const rarityIdx = RARITY_ORDER.indexOf(base.rarity) + 1;
  return Math.round(15 * rarityIdx + Math.pow(nextLevel, 1.65) * (6 + rarityIdx * 2));
}

function getItemDisplayName(itemInstance) {
  const base = ITEM_DB[itemInstance.id];
  if (!base) return 'Unknown';
  const upg = itemInstance.upgrade ? ` +${itemInstance.upgrade}` : '';
  return `${base.name}${upg}`;
}

// ==========================================
// 4. WORLD MAP, BUILDINGS & 2.5D GEOMETRY
// ==========================================
const TILE_SIZE = 48;
const MAP_W = 84;
const MAP_H = 84;
const VILLAGE_CENTER = { x: 42, y: 42 };

// Ground tile types
const GROUND = {
  GRASS: 0,
  PATH: 1,
  PLAZA: 2,
  FOREST: 3,
  QUARRY: 4,
  SHADOW: 5,
  VOLCANIC: 6,
  WATER: 7
};

const worldGround = new Uint8Array(MAP_W * MAP_H);
// Blocks grid stores object { type, hp, maxHp } or null
const worldBlocks = new Array(MAP_W * MAP_H).fill(null);
// Decorative trees / bushes / lamps
const worldProps = [];

// Village 2.5D Buildings (Pokemon style pitched roof + front facade + doorway + shopkeeper NPC)
const BUILDINGS = [
  {
    id: 'shop_weapons',
    name: 'Ironheart Armory (Weapons & Armor)',
    npcName: 'Garrick the Armorer',
    shopType: 'armory',
    tx: 34,
    ty: 35,
    tw: 5,
    th: 3,
    roofColor: '#b91c1c',
    roofDark: '#7f1d1d',
    wallColor: '#e7e5e4',
    trimColor: '#78350f',
    signIcon: '⚔️',
    npcX: 36.5,
    npcY: 38.8,
    npcColor: '#ef4444',
    greeting: 'Looking for sharp steel or sturdy armor? Remember: higher rarity armor requires a higher Hero Level!'
  },
  {
    id: 'shop_tools',
    name: 'Starlight Emporium (Potions, Pickaxes & Blocks)',
    npcName: 'Lyra the Alchemist & Miner',
    shopType: 'general',
    tx: 45,
    ty: 35,
    tw: 5,
    th: 3,
    roofColor: '#1d4ed8',
    roofDark: '#1e3a8a',
    wallColor: '#e7e5e4',
    trimColor: '#475569',
    signIcon: '🧪',
    npcX: 47.5,
    npcY: 38.8,
    npcColor: '#38bdf8',
    greeting: 'Stock up on Health Potions and Pickaxes before venturing out! You can also sell your mined Ores and Bones here.'
  },
  {
    id: 'shop_blacksmith',
    name: 'Bram\'s Master Forge (Armor Upgrades +1 to +50)',
    npcName: 'Bram the Master Blacksmith',
    shopType: 'blacksmith',
    tx: 39,
    ty: 45,
    tw: 6,
    th: 3,
    roofColor: '#d97706',
    roofDark: '#92400e',
    wallColor: '#d6d3d1',
    trimColor: '#292524',
    signIcon: '⚒️',
    npcX: 42.0,
    npcY: 48.8,
    npcColor: '#f59e0b',
    greeting: 'Step up to my anvil! For Gold, I can temper any piece of armor up to +50!'
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
  if (dist < 13.5) {
    return { id: 'village', name: '🏡 Oakhaven Village (Safe Zone)', safe: true };
  }
  if (ty < 26 && tx > 24 && tx < 60) {
    return { id: 'quarry', name: '⛏️ Northern Crystal Quarry (Lv. 5-12)', safe: false };
  }
  if (tx >= 56 && ty >= 26) {
    return { id: 'shadow', name: '🌑 Eastern Shadowlands (Lv. 10-16)', safe: false };
  }
  if (ty >= 57) {
    return { id: 'volcanic', name: '🌋 Southern Dragon Peaks (Lv. 15-25)', safe: false };
  }
  return { id: 'forest', name: '🌲 Whispering Wilds (Lv. 1-6)', safe: false };
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
  // 1. Ground biomes
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const dx = tx - VILLAGE_CENTER.x;
      const dy = ty - VILLAGE_CENTER.y;
      const dist = Math.hypot(dx, dy);

      if (tx === 0 || ty === 0 || tx === MAP_W - 1 || ty === MAP_H - 1) {
        worldGround[idx(tx, ty)] = GROUND.WATER;
        placeWorldBlock(tx, ty, 2); // Border stone wall
        continue;
      }

      if (dist < 12.5) {
        worldGround[idx(tx, ty)] = dist < 5.5 ? GROUND.PLAZA : GROUND.GRASS;
      } else if (ty < 26 && tx > 22 && tx < 62) {
        worldGround[idx(tx, ty)] = GROUND.QUARRY;
      } else if (tx >= 56 && ty >= 24) {
        worldGround[idx(tx, ty)] = GROUND.SHADOW;
      } else if (ty >= 57) {
        worldGround[idx(tx, ty)] = GROUND.VOLCANIC;
      } else {
        worldGround[idx(tx, ty)] = GROUND.FOREST;
      }

      // Cobblestone roads radiating from Village Plaza (42, 42)
      if ((Math.abs(tx - VILLAGE_CENTER.x) <= 1 && ty > 12 && ty < 72) ||
          (Math.abs(ty - VILLAGE_CENTER.y) <= 1 && tx > 12 && tx < 72)) {
        worldGround[idx(tx, ty)] = GROUND.PATH;
      }
    }
  }

  // 2. Village Perimeter Wall with 4 Grand Gateways
  const wallMin = 30, wallMax = 54;
  for (let t = wallMin; t <= wallMax; t++) {
    const isGate = Math.abs(t - 42) <= 2;
    if (!isGate) {
      placeWorldBlock(t, wallMin, 2);
      placeWorldBlock(t, wallMax, 2);
      placeWorldBlock(wallMin, t, 2);
      placeWorldBlock(wallMax, t, 2);
    }
  }

  // 3. Seed Ore Nodes & Trees outside the village
  for (let ty = 2; ty < MAP_H - 2; ty++) {
    for (let tx = 2; tx < MAP_W - 2; tx++) {
      const dist = Math.hypot(tx - VILLAGE_CENTER.x, ty - VILLAGE_CENTER.y);
      if (dist < 14.5) continue; // Keep village & gates clear
      if (worldGround[idx(tx, ty)] === GROUND.PATH) continue;
      if (worldBlocks[idx(tx, ty)]) continue;

      const r = Math.random();
      const g = worldGround[idx(tx, ty)];

      if (g === GROUND.FOREST) {
        if (r < 0.045) worldProps.push({ type: 'tree', tx, ty });
        else if (r < 0.068) placeWorldBlock(tx, ty, 3); // Copper Ore
        else if (r < 0.082) placeWorldBlock(tx, ty, 2); // Stone
      } else if (g === GROUND.QUARRY) {
        if (r < 0.055) placeWorldBlock(tx, ty, 3); // Copper
        else if (r < 0.115) placeWorldBlock(tx, ty, 4); // Iron
        else if (r < 0.145) placeWorldBlock(tx, ty, 5); // Gold
        else if (r < 0.18) placeWorldBlock(tx, ty, 2); // Stone
      } else if (g === GROUND.SHADOW) {
        if (r < 0.03) worldProps.push({ type: 'deadtree', tx, ty });
        else if (r < 0.065) placeWorldBlock(tx, ty, 5); // Gold
        else if (r < 0.095) placeWorldBlock(tx, ty, 6); // Mythril
      } else if (g === GROUND.VOLCANIC) {
        if (r < 0.04) placeWorldBlock(tx, ty, 5); // Gold
        else if (r < 0.075) placeWorldBlock(tx, ty, 6); // Mythril
        else if (r < 0.105) placeWorldBlock(tx, ty, 7); // Celestite
      }
    }
  }

  // Add a few starter practice Copper & Stone blocks just outside the Village Gates so players can mine right away
  placeWorldBlock(40, 28, 3);
  placeWorldBlock(44, 28, 3);
  placeWorldBlock(45, 29, 2);
  placeWorldBlock(39, 29, 4);
}

// ==========================================
// 5. PLAYER STATE (Starts with 100 Gold!)
// ==========================================
const player = {
  x: VILLAGE_CENTER.x * TILE_SIZE,
  y: (VILLAGE_CENTER.y - 1) * TILE_SIZE,
  vx: 0,
  vy: 0,
  radius: 14,
  facing: 'down', // 'up', 'down', 'left', 'right'
  walkAnim: 0,
  swingTimer: 0,
  swingAngle: 0,

  level: 1,
  xp: 0,
  xpNext: 80,
  hp: 100,
  maxHp: 100,
  gold: 100, // Explicitly starts with 100 Gold as requested!
  bones: 0,

  // Equipped slots
  equipment: {
    weapon: null,
    tool: null,
    helmet: null,
    chestplate: null,
    leggings: null,
    boots: null
  },

  // Inventory list of item objects: { uid, id, qty, upgrade }
  inventory: [],
  activeHotbarIndex: 0,
  selectedPlaceBlockId: 'block_wood'
};

let nextItemUid = 1;

function addItemToInventory(itemId, qty = 1, upgrade = 0) {
  const base = ITEM_DB[itemId];
  if (!base) return null;

  // Stackable items: consumables, chests, blocks
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

  // Equipment (weapons, armor, tools) are individual instances so armor can hold +1..+50 upgrades
  let lastCreated = null;
  for (let i = 0; i < qty; i++) {
    lastCreated = { uid: nextItemUid++, id: itemId, qty: 1, upgrade };
    player.inventory.push(lastCreated);
  }
  updateHotbarUI();
  return lastCreated;
}

// Give the player a few starter Wood Blocks so they can test placing blocks anytime, while keeping full 100 Gold to buy their first Weapon, Pickaxe, Armor & Potions in the village shops!
addItemToInventory('block_wood', 10);

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
  const baseAtk = 6 + (player.level - 1) * 3;
  const baseDef = (player.level - 1) * 1;
  const baseHp = 100 + (player.level - 1) * 22;

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

  const totalMaxHp = baseHp + armorHp + (sb.maxHp || 0);
  const rawAtk = baseAtk + weaponAtk + (sb.atk || 0);
  const totalAtk = Math.round(rawAtk * (1 + (sb.atkMult || 0)));
  const totalDef = baseDef + armorDef + (sb.def || 0);
  const moveSpeed = 210 * (1 + (sb.speedMult || 0));
  const critChance = 0.05 + (sb.critChance || 0);
  const hpRegen = 1 + (sb.regen || 0);
  const lifesteal = sb.lifesteal || 0;

  let pickPower = 1;
  let mineSpeed = 0.75; // Bare hands slow mining of wood/stone; pickaxe speeds up & unlocks ores
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
    player.xpNext = Math.round(80 * Math.pow(player.level, 1.38));
    leveledUp = true;
  }
  if (leveledUp) {
    syncPlayerMaxHp();
    player.hp = player.maxHp;
    spawnFloatingText(player.x, player.y - 36, `🎉 LEVEL UP! Lv.${player.level}`, '#fde047', 24);
    showToast(`🌟 Level Up! You reached Hero Level ${player.level}! Higher-rarity armor unlocked!`);
    for (let i = 0; i < 24; i++) {
      spawnParticle(player.x, player.y, '#fbbf24', 140);
    }
  }
  updateHudUI();
}

// ==========================================
// 6. MONSTERS, COMBAT & LOOT DROPS
// ==========================================
const MONSTER_TYPES = [
  {
    id: 'slime',
    name: 'Emerald Slime',
    biome: 'forest',
    level: 1,
    hp: 38,
    atk: 7,
    def: 1,
    speed: 78,
    xp: 22,
    goldMin: 8,
    goldMax: 16,
    bones: [1, 2],
    chestDropChance: 0.18,
    chestId: 'chest_tier_1',
    color: '#4ade80',
    eyeColor: '#064e3b',
    radius: 14
  },
  {
    id: 'skeleton',
    name: 'Wandering Skeleton',
    biome: 'forest',
    level: 3,
    hp: 85,
    atk: 15,
    def: 4,
    speed: 95,
    xp: 45,
    goldMin: 18,
    goldMax: 32,
    bones: [2, 4],
    chestDropChance: 0.20,
    chestId: 'chest_tier_2',
    color: '#e2e8f0',
    eyeColor: '#ef4444',
    radius: 15
  },
  {
    id: 'goblin',
    name: 'Quarry Goblin Raider',
    biome: 'quarry',
    level: 6,
    hp: 190,
    atk: 30,
    def: 10,
    speed: 112,
    xp: 95,
    goldMin: 38,
    goldMax: 68,
    bones: [2, 5],
    chestDropChance: 0.22,
    chestId: 'chest_tier_3',
    color: '#84cc16',
    eyeColor: '#facc15',
    radius: 15
  },
  {
    id: 'golem',
    name: 'Cobalt Crystal Golem',
    biome: 'quarry',
    level: 9,
    hp: 390,
    atk: 52,
    def: 22,
    speed: 72,
    xp: 180,
    goldMin: 75,
    goldMax: 130,
    bones: [3, 6],
    chestDropChance: 0.26,
    chestId: 'chest_tier_3',
    color: '#38bdf8',
    eyeColor: '#e0f2fe',
    radius: 19
  },
  {
    id: 'wraith',
    name: 'Shadowlands Void Knight',
    biome: 'shadow',
    level: 13,
    hp: 820,
    atk: 98,
    def: 42,
    speed: 118,
    xp: 380,
    goldMin: 160,
    goldMax: 260,
    bones: [4, 8],
    chestDropChance: 0.28,
    chestId: 'chest_tier_4',
    color: '#a855f7',
    eyeColor: '#f43f5e',
    radius: 17
  },
  {
    id: 'demon',
    name: 'Infernal Magma Brute',
    biome: 'volcanic',
    level: 17,
    hp: 1650,
    atk: 165,
    def: 75,
    speed: 105,
    xp: 750,
    goldMin: 340,
    goldMax: 520,
    bones: [6, 12],
    chestDropChance: 0.32,
    chestId: 'chest_tier_5',
    color: '#f97316',
    eyeColor: '#fef08a',
    radius: 20
  },
  {
    id: 'dragon_boss',
    name: 'Ignis, Mythic Abyssal Dragon',
    biome: 'volcanic',
    isBoss: true,
    level: 22,
    hp: 4500,
    atk: 280,
    def: 120,
    speed: 96,
    xp: 2400,
    goldMin: 1200,
    goldMax: 1800,
    bones: [15, 25],
    chestDropChance: 0.85,
    chestId: 'chest_tier_6',
    color: '#ff3e6c',
    eyeColor: '#fde047',
    radius: 28
  }
];

const monsters = [];
const groundDrops = []; // { x, y, z, vz, type: 'gold'|'bone'|'chest', amount, chestId, timer }
const particles = [];
const floatingTexts = [];

function spawnMonsterInBiome(mType, customX, customY) {
  let x = customX, y = customY;
  if (x === undefined || y === undefined) {
    for (let tries = 0; tries < 40; tries++) {
      const tx = 3 + Math.floor(Math.random() * (MAP_W - 6));
      const ty = 3 + Math.floor(Math.random() * (MAP_H - 6));
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
    vx: 0,
    vy: 0,
    hp: mType.hp,
    maxHp: mType.hp,
    atkCooldown: 0,
    hurtTimer: 0,
    wanderAngle: Math.random() * Math.PI * 2,
    wanderTimer: 1 + Math.random() * 2
  });
}

function populateInitialMonsters() {
  // Spawn a balanced ecosystem across all biomes
  for (let i = 0; i < 18; i++) spawnMonsterInBiome(MONSTER_TYPES[0]); // Slimes
  for (let i = 0; i < 12; i++) spawnMonsterInBiome(MONSTER_TYPES[1]); // Skeletons
  for (let i = 0; i < 10; i++) spawnMonsterInBiome(MONSTER_TYPES[2]); // Goblins
  for (let i = 0; i < 7; i++) spawnMonsterInBiome(MONSTER_TYPES[3]);  // Golems
  for (let i = 0; i < 9; i++) spawnMonsterInBiome(MONSTER_TYPES[4]);  // Void Knights
  for (let i = 0; i < 8; i++) spawnMonsterInBiome(MONSTER_TYPES[5]);  // Magma Brutes
  // Spawn the Mythic Boss in the deep Southern Dragon Peaks
  spawnMonsterInBiome(MONSTER_TYPES[6], 42 * TILE_SIZE, 74 * TILE_SIZE);

  // Also place a few guaranteed Slimes near the Village South & West exits so the player sees action immediately!
  spawnMonsterInBiome(MONSTER_TYPES[0], 42 * TILE_SIZE, 26 * TILE_SIZE);
  spawnMonsterInBiome(MONSTER_TYPES[0], 26 * TILE_SIZE, 42 * TILE_SIZE);
  spawnMonsterInBiome(MONSTER_TYPES[1], 58 * TILE_SIZE, 42 * TILE_SIZE);
}

// ==========================================
// 7. CHEST LOOT GENERATOR (Scaled by Monster Difficulty)
// ==========================================
function openMonsterChest(chestItemId) {
  const chestDef = ITEM_DB[chestItemId];
  if (!chestDef || chestDef.type !== 'chest') return;

  // Consume 1 chest from inventory
  const invEntry = player.inventory.find(i => i.id === chestItemId);
  if (!invEntry || invEntry.qty <= 0) return;
  invEntry.qty--;
  if (invEntry.qty <= 0) {
    player.inventory = player.inventory.filter(i => i !== invEntry);
  }

  // Determine rarity weights based on chestTier (1 to 6)
  const tier = chestDef.chestTier;
  const weightsByTier = {
    1: { common: 55, uncommon: 38, rare: 7, epic: 0, legendary: 0, mythic: 0 },
    2: { common: 15, uncommon: 55, rare: 26, epic: 4, legendary: 0, mythic: 0 },
    3: { common: 0, uncommon: 25, rare: 55, epic: 18, legendary: 2, mythic: 0 },
    4: { common: 0, uncommon: 0, rare: 28, epic: 56, legendary: 14, mythic: 2 },
    5: { common: 0, uncommon: 0, rare: 0, epic: 35, legendary: 53, mythic: 12 },
    6: { common: 0, uncommon: 0, rare: 0, epic: 10, legendary: 50, mythic: 40 }
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

  // Pick a random equipment item of that rarity (Weapon, Armor, or Pickaxe)
  const candidates = Object.values(ITEM_DB).filter(
    item => item.rarity === chosenRarity && (item.type === 'weapon' || item.type === 'armor' || item.type === 'tool')
  );
  const wonItem = candidates[Math.floor(Math.random() * candidates.length)];

  // Bonus pre-upgraded level if it's armor from a high-tier chest!
  let bonusUpgrade = 0;
  if (wonItem.type === 'armor' && tier >= 2) {
    bonusUpgrade = Math.floor(Math.random() * (tier * 2)) + 1;
  }

  const bonusGold = Math.round((25 * Math.pow(tier, 1.8)) * (0.8 + Math.random() * 0.5));
  player.gold += bonusGold;
  const createdInstance = addItemToInventory(wonItem.id, 1, bonusUpgrade);

  // Show Chest Modal
  const rInfo = RARITIES[chosenRarity];
  const modal = document.getElementById('modal-chest');
  const body = document.getElementById('chest-loot-result');
  body.innerHTML = `
    <div style="font-size: 52px;">${wonItem.icon}</div>
    <div class="rarity-tag rarity-${chosenRarity}">${rInfo.name} Reward</div>
    <div style="font-size: 28px; color: ${rInfo.color}; font-weight: bold;">
      ${getItemDisplayName(createdInstance)}
    </div>
    <div style="color: #cbd5e1; max-width: 380px;">${wonItem.desc}</div>
    <div style="color: #fbbf24; font-size: 22px;">+ 🪙 ${bonusGold} Bonus Gold!</div>
    <button class="pixel-btn action-btn" id="btn-chest-claim">Awesome!</button>
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
  // Move X
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

  // Move Y
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
// 9. INPUT, CAMERA & HOTBAR ACTIONS
// ==========================================
const keys = {};
let mouseScreenX = 0;
let mouseScreenY = 0;
let mouseWorldX = 0;
let mouseWorldY = 0;
let isLeftMouseDown = false;
let actionCooldown = 0;

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

function getTargetTileFromCursor() {
  const tx = Math.floor(mouseWorldX / TILE_SIZE);
  const ty = Math.floor(mouseWorldY / TILE_SIZE);
  return { tx, ty };
}

function performPrimaryAction() {
  if (actionCooldown > 0) return;

  const st = getPlayerStats();
  actionCooldown = 0.26;
  player.swingTimer = 0.24;

  // Update facing toward mouse cursor
  const dx = mouseWorldX - player.x;
  const dy = mouseWorldY - player.y;
  player.swingAngle = Math.atan2(dy, dx);
  if (Math.abs(dx) > Math.abs(dy)) {
    player.facing = dx > 0 ? 'right' : 'left';
  } else {
    player.facing = dy > 0 ? 'down' : 'up';
  }

  // 1. Check if attacking any Monster within reach
  let hitMonster = false;
  const reach = 74;
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    const dist = Math.hypot(m.x - player.x, m.y - player.y);
    if (dist <= reach + m.type.radius) {
      const angleToM = Math.atan2(m.y - player.y, m.x - player.x);
      let angleDiff = Math.abs(angleToM - player.swingAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      if (angleDiff < 1.35 || dist < 38) {
        hitMonster = true;
        const isCrit = Math.random() < st.critChance;
        const rawDmg = Math.max(1, st.atk - Math.floor(m.type.def * 0.4));
        const dmg = Math.round(rawDmg * (isCrit ? 1.75 : 1) * (0.92 + Math.random() * 0.16));
        m.hp -= dmg;
        m.hurtTimer = 0.18;

        // Knockback
        const kb = 14;
        moveEntityWithCollision(m, Math.cos(angleToM) * kb, Math.sin(angleToM) * kb);

        // Lifesteal
        if (st.lifesteal > 0) {
          const heal = Math.max(1, Math.round(dmg * st.lifesteal));
          player.hp = Math.min(player.maxHp, player.hp + heal);
        }

        spawnFloatingText(
          m.x,
          m.y - 24,
          isCrit ? `💥 ${dmg}!` : `-${dmg}`,
          isCrit ? '#fde047' : '#ffffff',
          isCrit ? 23 : 19
        );
        for (let p = 0; p < 6; p++) {
          spawnParticle(m.x, m.y, m.type.color, 90);
        }

        if (m.hp <= 0) {
          handleMonsterDefeat(m, i);
        }
      }
    }
  }

  if (hitMonster) {
    updateHudUI();
    return;
  }

  // 2. Otherwise check if mining a block within 3 tiles
  const { tx, ty } = getTargetTileFromCursor();
  const blockCenterX = (tx + 0.5) * TILE_SIZE;
  const blockCenterY = (ty + 0.5) * TILE_SIZE;
  const distToBlock = Math.hypot(blockCenterX - player.x, blockCenterY - player.y);

  if (inBounds(tx, ty) && distToBlock <= TILE_SIZE * 2.8) {
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

      const mineDmg = Math.round(18 * st.mineSpeed);
      blk.hp -= mineDmg;
      for (let p = 0; p < 5; p++) {
        spawnParticle(blockCenterX, blockCenterY - 12, bDef.topColor, 70);
      }

      if (blk.hp <= 0) {
        worldBlocks[idx(tx, ty)] = null;
        addItemToInventory(bDef.id, 1);
        gainXp(bDef.reqPower * 5);
        spawnFloatingText(blockCenterX, blockCenterY - 24, `+1 ${bDef.name}`, bDef.speckle || '#fde047', 18);
      } else {
        spawnFloatingText(blockCenterX, blockCenterY - 18, `⛏️ ${blk.hp}/${blk.maxHp}`, '#cbd5e1', 15);
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

  if (dist > TILE_SIZE * 3.2) {
    showToast('Too far away to place a block!');
    return;
  }
  if (dist < TILE_SIZE * 0.75) {
    showToast('Cannot place a block directly on yourself!');
    return;
  }
  if (isSolidAtTile(tx, ty)) {
    return;
  }

  // Find selected block in inventory
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
  const t = m.type;
  gainXp(t.xp);

  // Drop Gold
  const goldAmt = t.goldMin + Math.floor(Math.random() * (t.goldMax - t.goldMin + 1));
  groundDrops.push({
    x: m.x + (Math.random() - 0.5) * 20,
    y: m.y + (Math.random() - 0.5) * 20,
    z: 14,
    vz: 90,
    type: 'gold',
    amount: goldAmt
  });

  // Drop Bones
  const boneAmt = t.bones[0] + Math.floor(Math.random() * (t.bones[1] - t.bones[0] + 1));
  groundDrops.push({
    x: m.x + (Math.random() - 0.5) * 24,
    y: m.y + (Math.random() - 0.5) * 24,
    z: 16,
    vz: 110,
    type: 'bone',
    amount: boneAmt
  });

  // Rare Monster Chest Drop scaled by monster difficulty!
  if (Math.random() < t.chestDropChance) {
    groundDrops.push({
      x: m.x,
      y: m.y,
      z: 20,
      vz: 140,
      type: 'chest',
      chestId: t.chestId
    });
    const chestDef = ITEM_DB[t.chestId];
    showToast(`🎁 RARE DROP! ${t.name} dropped a ${chestDef.name}!`);
  }

  if (t.isBoss) {
    showToast(`👑 VICTORY! You slew ${t.name}, proving yourself the Strongest Warrior of Valoria!`);
    setTimeout(() => spawnMonsterInBiome(t, 42 * TILE_SIZE, 74 * TILE_SIZE), 25000);
  } else {
    setTimeout(() => spawnMonsterInBiome(t), 9000);
  }
}

// ==========================================
// 10. HOTBAR & UI RENDERING
// ==========================================
function buildHotbarSlots() {
  const slots = [];
  // Slot 1: Equipped Weapon
  slots.push({
    kind: 'weapon',
    label: player.equipment.weapon ? ITEM_DB[player.equipment.weapon.id].name : 'Fists',
    icon: player.equipment.weapon ? ITEM_DB[player.equipment.weapon.id].icon : '✊',
    rarity: player.equipment.weapon ? ITEM_DB[player.equipment.weapon.id].rarity : 'common'
  });
  // Slot 2: Equipped Pickaxe
  slots.push({
    kind: 'tool',
    label: player.equipment.tool ? ITEM_DB[player.equipment.tool.id].name : 'No Pick',
    icon: player.equipment.tool ? ITEM_DB[player.equipment.tool.id].icon : '⛏️',
    rarity: player.equipment.tool ? ITEM_DB[player.equipment.tool.id].rarity : 'common'
  });

  // Slots 3-8: Consumables, Chests, and Placeable Blocks in inventory
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
      showToast(`🧱 Selected ${d.name} (Right-Click or press B to place)`);
    }
  }
  updateHotbarUI();
}

function useConsumableItem(itemId) {
  const entry = player.inventory.find(i => i.id === itemId);
  if (!entry || entry.qty <= 0) return;
  const def = ITEM_DB[itemId];
  if (!def || def.type !== 'consumable') return;

  if (player.hp >= player.maxHp) {
    showToast('Your HP is already full!');
    return;
  }

  entry.qty--;
  if (entry.qty <= 0) {
    player.inventory = player.inventory.filter(i => i !== entry);
  }
  player.hp = Math.min(player.maxHp, player.hp + def.heal);
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
    setBanner.textContent = `✨ ${st.activeSet.setName} Active!`;
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
  return !document.querySelectorAll('.modal-overlay:not(.hidden)').length === false &&
         document.querySelectorAll('.modal-overlay:not(.hidden)').length > 0;
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

  // Enforce Level Requirement for Armor!
  if (player.level < (def.levelReq || 1)) {
    showToast(`🔒 Requires Hero Level ${def.levelReq} to equip ${def.name}! Fight monsters to level up!`);
    return;
  }

  // Remove from bag and swap with currently equipped
  player.inventory.splice(entryIndex, 1);
  if (player.equipment[def.slot]) {
    player.inventory.push(player.equipment[def.slot]);
  }
  player.equipment[def.slot] = entry;

  syncPlayerMaxHp();
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

  // 1. Equipped Slots
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

  // 2. Full Set Bonus Display
  const setBox = document.getElementById('equip-set-info');
  const setDesc = document.getElementById('equip-set-desc');
  if (st.activeSet) {
    setBox.classList.add('active-set');
    setDesc.innerHTML = `<b style="color:${st.activeSet.color}">${st.activeSet.setName} (4/4):</b> ${st.activeSet.setBonusDesc}`;
  } else {
    setBox.classList.remove('active-set');
    setDesc.textContent = 'Equip 4 armor pieces (Helm, Cuirass, Greaves, Sabatons) of the SAME Rarity to activate a powerful Set Bonus!';
  }

  // 3. Hero Stats Summary
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

  // 4. Backpack Grid
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
    if (d.type === 'weapon') subText = `⚔️ +${d.atk} ATK`;
    else if (d.type === 'armor') {
      const aSt = getArmorStats(entry);
      subText = `🛡️ +${aSt.def} DEF | Lv.${d.levelReq}`;
    } else if (d.type === 'tool') subText = `⛏️ Power ${d.power}`;
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

  // 5. Detail Panel
  const detailPanel = document.getElementById('item-detail-panel');
  const selEntry = player.inventory.find(i => i.uid === selectedBagUid);
  if (!selEntry) {
    detailPanel.innerHTML = `<div class="detail-placeholder">Select any item in your backpack to inspect, equip, use, or sell.</div>`;
    return;
  }

  const d = ITEM_DB[selEntry.id];
  const rInfo = RARITIES[d.rarity];
  let statsHtml = `<span class="rarity-tag rarity-${d.rarity}">${rInfo.name}</span>`;
  if (d.type === 'weapon') statsHtml += `<span>⚔️ Attack: +${d.atk}</span>`;
  if (d.type === 'armor') {
    const aSt = getArmorStats(selEntry);
    const reqColor = player.level >= d.levelReq ? '#4ade80' : '#f87171';
    statsHtml += `<span>🛡️ Defense: +${aSt.def}</span><span>❤️ Max HP: +${aSt.hp}</span><span style="color:${reqColor}">🔒 Req Level: ${d.levelReq}</span>`;
  }
  if (d.type === 'tool') statsHtml += `<span>⛏️ Tier ${d.power} (${d.mineSpeed}x Speed)</span>`;

  const sellVal = d.sellPrice || Math.max(2, Math.floor((d.price || 10) * 0.45 + (selEntry.upgrade || 0) * 15));

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div class="detail-title" style="color:${rInfo.color}">${d.icon} ${getItemDisplayName(selEntry)}</div>
      <div>Sell Value: <b style="color:#fbbf24">🪙 ${sellVal}g</b></div>
    </div>
    <div class="detail-stats">${statsHtml}</div>
    <div style="color:#cbd5e1; font-size:17px;">${d.desc}</div>
    <div class="detail-actions" id="bag-item-actions"></div>
  `;

  const actContainer = document.getElementById('bag-item-actions');
  if (d.type === 'weapon' || d.type === 'armor' || d.type === 'tool') {
    const btnEq = document.createElement('button');
    btnEq.className = 'pixel-btn action-btn';
    btnEq.textContent = player.level >= (d.levelReq || 1) ? 'Equip Item' : `🔒 Requires Lv.${d.levelReq}`;
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
    btnOpen.textContent = '🎁 Open Loot Chest';
    btnOpen.onclick = () => openMonsterChest(selEntry.id);
    actContainer.appendChild(btnOpen);
  } else if (d.type === 'block') {
    const btnSel = document.createElement('button');
    btnSel.className = 'pixel-btn action-btn';
    btnSel.textContent = '🧱 Select to Place (R-Click)';
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
    document.getElementById('shop-title').textContent = `🏪 ${b.name}`;
    document.getElementById('shop-greeting').textContent = `${b.npcName}: "${b.greeting}"`;
    document.getElementById('modal-shop').classList.remove('hidden');
    renderShopModal();
  }
}

function getShopCatalog(shopType) {
  if (shopType === 'armory') {
    // Weapons and Armor (Common through Legendary available for Gold; Mythic can also be bought for 12,000g or found in Boss Chests!)
    return Object.values(ITEM_DB).filter(i => i.type === 'weapon' || i.type === 'armor');
  }
  // General store: Potions, Pickaxes, and Building Blocks
  return Object.values(ITEM_DB).filter(
    i => i.type === 'consumable' || i.type === 'tool' || (i.type === 'block' && i.blockType <= 2)
  );
}

function renderShopModal() {
  const catalog = getShopCatalog(currentShopType);
  const grid = document.getElementById('shop-items-grid');
  grid.innerHTML = '';

  catalog.forEach(item => {
    const card = document.createElement('div');
    card.className = `item-card rarity-${item.rarity} ${selectedShopItemId === item.id ? 'selected' : ''}`;

    let statLine = `🪙 ${item.price}g`;
    if (item.type === 'armor') statLine = `🪙 ${item.price}g | Lv.${item.levelReq}`;

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
  if (sel.type === 'weapon') statsHtml += `<span>⚔️ +${sel.atk} ATK</span>`;
  if (sel.type === 'armor') statsHtml += `<span>🛡️ +${sel.def} DEF</span><span>❤️ +${sel.hp} HP</span><span>🔒 Req Lv.${sel.levelReq}</span>`;
  if (sel.type === 'tool') statsHtml += `<span>⛏️ Tier ${sel.power} (${sel.mineSpeed}x Speed)</span>`;
  if (sel.type === 'consumable') statsHtml += `<span>❤️ Restores ${sel.heal} HP</span>`;

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div class="detail-title" style="color:${rInfo.color}">${sel.icon} ${sel.name}</div>
      <div style="font-size:22px; color:#fbbf24">🪙 ${sel.price} Gold</div>
    </div>
    <div class="detail-stats">${statsHtml}</div>
    <div style="color:#cbd5e1; font-size:17px;">${sel.desc}</div>
    <div class="detail-actions">
      <button class="pixel-btn action-btn" id="btn-buy-shop-item">Buy for 🪙 ${sel.price}g</button>
    </div>
  `;

  document.getElementById('btn-buy-shop-item').onclick = () => {
    if (player.gold < sel.price) {
      showToast(`Not enough Gold! You need ${sel.price}g (You have ${player.gold}g).`);
      return;
    }
    player.gold -= sel.price;
    const created = addItemToInventory(sel.id, 1);

    // Auto-equip if the slot is currently empty and player meets level requirement!
    if ((sel.type === 'weapon' || sel.type === 'tool' || sel.type === 'armor') &&
        !player.equipment[sel.slot] &&
        player.level >= (sel.levelReq || 1)) {
      equipItemInstance(created.uid);
    } else {
      showToast(`Purchased ${sel.name}!`);
    }
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
  const earned = player.bones * 4;
  const count = player.bones;
  player.bones = 0;
  player.gold += earned;
  updateHudUI();
  showToast(`Sold ${count} Bones for 🪙 ${earned} Gold!`);
};

document.getElementById('btn-sell-ores').onclick = () => {
  let totalEarned = 0;
  let totalSold = 0;
  player.inventory = player.inventory.filter(entry => {
    const d = ITEM_DB[entry.id];
    if (d && d.type === 'block' && d.blockType >= 3) {
      totalEarned += d.sellPrice * entry.qty;
      totalSold += entry.qty;
      return false;
    }
    return true;
  });

  if (totalSold === 0) {
    showToast('No mined Ores in your inventory! Use a Pickaxe to mine Copper, Iron, Gold, or Mythril.');
    return;
  }
  player.gold += totalEarned;
  updateHudUI();
  updateHotbarUI();
  showToast(`Sold ${totalSold} Mined Ores for 🪙 ${totalEarned} Gold!`);
};

// BLACKSMITH (+1 to +50 Armor Upgrading)
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
    listEl.innerHTML = `<div class="detail-placeholder">You don't own any armor yet! Visit Garrick's Armory next door to buy your first armor piece.</div>`;
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
      <div class="item-sub">🛡️ +${st.def} DEF | ❤️ +${st.hp} Max HP</div>
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
        🌟 <b>MAXIMUM LEVEL (+50) ACHIEVED!</b><br/>
        🛡️ Defense: <b>+${curStats.def}</b><br/>
        ❤️ Bonus Max HP: <b>+${curStats.hp}</b>
      </div>
    `;
    return;
  }

  const nextStats = getArmorStats({ id: inst.id, upgrade: curUpg + 1 });
  const cost = getUpgradeCost(inst);

  anvilEl.innerHTML = `
    <div style="font-size:24px; color:${rInfo.color}">${d.icon} ${getItemDisplayName(inst)}</div>
    <div>Upgrade Level: <b>+${curUpg} ➔ +${curUpg + 1}</b> (Max +50)</div>
    <div class="upgrade-preview-box">
      <div>🛡️ Defense: <b>+${curStats.def}</b> ➔ <b style="color:#4ade80">+${nextStats.def}</b> (+${nextStats.def - curStats.def})</div>
      <div>❤️ Max HP: <b>+${curStats.hp}</b> ➔ <b style="color:#4ade80">+${nextStats.hp}</b> (+${nextStats.hp - curStats.hp})</div>
    </div>
    <div style="font-size:21px; color:#fbbf24">Forge Cost: 🪙 ${cost} Gold</div>
    <div style="display:flex; gap:8px;">
      <button class="pixel-btn action-btn" id="btn-smith-upgrade-1">🔨 Forge +1 (${cost}g)</button>
      <button class="pixel-btn gold-btn" id="btn-smith-upgrade-5">🔥 Forge +5</button>
    </div>
  `;

  document.getElementById('btn-smith-upgrade-1').onclick = () => {
    if (player.gold < cost) {
      showToast(`Not enough Gold! Need ${cost}g.`);
      return;
    }
    player.gold -= cost;
    inst.upgrade = curUpg + 1;
    syncPlayerMaxHp();
    updateHudUI();
    renderBlacksmithModal();
    showToast(`⚒️ Upgraded ${d.name} to +${inst.upgrade}!`);
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
      syncPlayerMaxHp();
      updateHudUI();
      renderBlacksmithModal();
      showToast(`🔥 Tempered ${d.name} to +${inst.upgrade}!`);
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

  const st = getPlayerStats();

  // Passive HP Regen (+ Extra Regen in Village Safe Zone)
  const currentZone = getZoneAt(Math.floor(player.x / TILE_SIZE), Math.floor(player.y / TILE_SIZE));
  document.getElementById('zone-banner').textContent = currentZone.name;

  regenAccumulator += dt;
  if (regenAccumulator >= 1.0) {
    regenAccumulator = 0;
    const healAmt = currentZone.safe ? Math.max(8, st.hpRegen + 6) : st.hpRegen;
    if (player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      updateHudUI();
    }
  }

  // Player Movement (when no modal is open)
  if (!isAnyModalOpen()) {
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
      player.walkAnim += dt * 10;

      if (player.swingTimer <= 0) {
        if (Math.abs(mx) > Math.abs(my)) player.facing = mx > 0 ? 'right' : 'left';
        else player.facing = my > 0 ? 'down' : 'up';
      }
    }

    if (isLeftMouseDown || keys['Space']) {
      performPrimaryAction();
    }
  }

  // Check proximity to Village NPCs for interaction prompt
  const nearBuilding = getNearestBuilding();
  const promptEl = document.getElementById('interact-prompt');
  if (nearBuilding && !isAnyModalOpen()) {
    promptEl.classList.remove('hidden');
    promptEl.innerHTML = `Press <span class="key-badge">F</span> to talk to <b>${nearBuilding.npcName}</b>`;
  } else {
    promptEl.classList.add('hidden');
  }

  // Update Monsters
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    if (m.hurtTimer > 0) m.hurtTimer -= dt;
    if (m.atkCooldown > 0) m.atkCooldown -= dt;

    const distToPlayer = Math.hypot(player.x - m.x, player.y - m.y);
    const mZone = getZoneAt(Math.floor(m.x / TILE_SIZE), Math.floor(m.y / TILE_SIZE));

    // Monsters never enter the Village Safe Zone
    if (mZone.safe) {
      const awayAng = Math.atan2(m.y - VILLAGE_CENTER.y * TILE_SIZE, m.x - VILLAGE_CENTER.x * TILE_SIZE);
      moveEntityWithCollision(m, Math.cos(awayAng) * m.type.speed * dt, Math.sin(awayAng) * m.type.speed * dt);
      continue;
    }

    if (!currentZone.safe && distToPlayer < 260) {
      // Chase player
      const ang = Math.atan2(player.y - m.y, player.x - m.x);
      moveEntityWithCollision(m, Math.cos(ang) * m.type.speed * dt, Math.sin(ang) * m.type.speed * dt);

      // Attack player on contact
      if (distToPlayer <= m.type.radius + player.radius + 8 && m.atkCooldown <= 0) {
        m.atkCooldown = 1.05;
        const dmg = Math.max(1, Math.round(m.type.atk - st.def * 0.65));
        player.hp -= dmg;
        spawnFloatingText(player.x, player.y - 26, `-${dmg} HP`, '#ef4444', 20);
        for (let p = 0; p < 5; p++) spawnParticle(player.x, player.y, '#ef4444', 80);

        if (player.hp <= 0) {
          // Respawn safely in Oakhaven Village without losing gear
          player.hp = player.maxHp;
          player.x = VILLAGE_CENTER.x * TILE_SIZE;
          player.y = (VILLAGE_CENTER.y - 1) * TILE_SIZE;
          showToast('💫 You were knocked out and rescued back to Oakhaven Village!');
        }
        updateHudUI();
      }
    } else {
      // Wander
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

  // Update Ground Drops (Gold, Bones, and Monster Chests)
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

    // Magnetic pickup when player gets close
    const dist = Math.hypot(player.x - d.x, player.y - d.y);
    if (dist < 90) {
      const pull = (95 - dist) * 4.5 * dt;
      const ang = Math.atan2(player.y - d.y, player.x - d.x);
      d.x += Math.cos(ang) * pull;
      d.y += Math.sin(ang) * pull;
    }

    if (dist < 26) {
      if (d.type === 'gold') {
        player.gold += d.amount;
        spawnFloatingText(player.x, player.y - 24, `+${d.amount} Gold`, '#fbbf24', 18);
      } else if (d.type === 'bone') {
        player.bones += d.amount;
        spawnFloatingText(player.x, player.y - 24, `+${d.amount} Bone`, '#e2e8f0', 18);
      } else if (d.type === 'chest') {
        const cDef = ITEM_DB[d.chestId];
        addItemToInventory(d.chestId, 1);
        spawnFloatingText(player.x, player.y - 34, `🎁 +1 ${cDef.name}!`, RARITIES[cDef.rarity].color, 21);
      }
      groundDrops.splice(i, 1);
      updateHudUI();
    }
  }

  // Particles & Floating Texts
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
// 15. POKEMON-STYLE 2.5D OBLIQUE RENDERER
// ==========================================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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

      // Subtle pixel details on grass/plaza
      if (g === GROUND.PLAZA) {
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        ctx.strokeRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if ((g === GROUND.GRASS || g === GROUND.FOREST) && ((tx * 19 + ty * 31) % 7 === 0)) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(sx + 12, sy + 14, 4, 8);
        ctx.fillRect(sx + 18, sy + 18, 4, 6);
      }
    }
  }
}

// Draw a 2.5D Oblique Block (Top face shifted up by blockHeight, Front vertical face visible + drop shadow)
function draw25DBlock(tx, ty, blk, camX, camY) {
  const bDef = BLOCK_BY_TYPE[blk.type];
  const sx = tx * TILE_SIZE - camX;
  const sy = ty * TILE_SIZE - camY;
  const wallH = 22; // 3D vertical extrusion height

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.fillRect(sx + 4, sy + 6, TILE_SIZE, TILE_SIZE - 2);

  // Front vertical face (3D perspective side)
  ctx.fillStyle = bDef.sideColor;
  ctx.fillRect(sx, sy + TILE_SIZE - wallH, TILE_SIZE, wallH);

  // Top face shifted upward
  ctx.fillStyle = bDef.topColor;
  ctx.fillRect(sx, sy - wallH, TILE_SIZE, TILE_SIZE);

  // Pixel bevel highlight on top face
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 1, sy - wallH + 1, TILE_SIZE - 2, TILE_SIZE - 2);

  // Ore crystal speckles on both Top and Front face!
  if (bDef.speckle) {
    ctx.fillStyle = bDef.speckle;
    ctx.fillRect(sx + 10, sy - wallH + 12, 8, 8);
    ctx.fillRect(sx + 28, sy - wallH + 22, 9, 7);
    ctx.fillRect(sx + 16, sy - wallH + 32, 7, 7);
    // Front face ore glint
    ctx.fillRect(sx + 14, sy + TILE_SIZE - wallH + 6, 7, 7);
    ctx.fillRect(sx + 30, sy + TILE_SIZE - wallH + 9, 6, 6);
  }

  // Damage cracks if partially mined
  if (blk.hp < blk.maxHp) {
    const ratio = 1 - blk.hp / blk.maxHp;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * ratio})`;
    ctx.fillRect(sx + 8, sy - wallH + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  }
}

// Draw a Pokemon Gen-4/5 style 2.5D Building with pitched roof, front wall facade, door, windows, sign & NPC
function draw25DBuilding(b, camX, camY) {
  const sx = b.tx * TILE_SIZE - camX;
  const sy = b.ty * TILE_SIZE - camY;
  const w = b.tw * TILE_SIZE;
  const h = b.th * TILE_SIZE;
  const wallHeight = 52;
  const roofHeight = 56;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(sx + 8, sy + 10, w, h);

  // Front Wall Facade
  ctx.fillStyle = b.wallColor;
  ctx.fillRect(sx, sy + h - wallHeight, w, wallHeight);

  // Timber framing pillars
  ctx.fillStyle = b.trimColor;
  ctx.fillRect(sx, sy + h - wallHeight, 8, wallHeight);
  ctx.fillRect(sx + w - 8, sy + h - wallHeight, 8, wallHeight);
  ctx.fillRect(sx, sy + h - 8, w, 8);

  // Doorway in center
  const doorW = 36, doorH = 38;
  const doorX = sx + w / 2 - doorW / 2;
  const doorY = sy + h - doorH;
  ctx.fillStyle = '#451a03';
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(doorX, doorY, doorW, doorH);

  // Windows with warm glow
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(sx + 24, sy + h - wallHeight + 14, 26, 22);
  ctx.fillRect(sx + w - 50, sy + h - wallHeight + 14, 26, 22);
  ctx.strokeStyle = b.trimColor;
  ctx.strokeRect(sx + 24, sy + h - wallHeight + 14, 26, 22);
  ctx.strokeRect(sx + w - 50, sy + h - wallHeight + 14, 26, 22);

  // Pitched 2.5D Roof overhanging the front facade
  ctx.fillStyle = b.roofDark;
  ctx.fillRect(sx - 6, sy - roofHeight, w + 12, h - wallHeight + roofHeight);

  ctx.fillStyle = b.roofColor;
  ctx.fillRect(sx - 4, sy - roofHeight + 6, w + 8, h - wallHeight + roofHeight - 14);

  // Roof ridge lines (Pokemon tile texture)
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  for (let ry = sy - roofHeight + 14; ry < sy + h - wallHeight - 6; ry += 12) {
    ctx.fillRect(sx, ry, w, 3);
  }

  // Floating Building Signboard
  ctx.font = 'bold 16px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(15, 12, 24, 0.85)';
  ctx.fillRect(sx + w / 2 - 95, sy - roofHeight - 26, 190, 22);
  ctx.strokeStyle = '#fbbf24';
  ctx.strokeRect(sx + w / 2 - 95, sy - roofHeight - 26, 190, 22);
  ctx.fillStyle = '#fde68a';
  ctx.fillText(`${b.signIcon} ${b.name.split('(')[0]}`, sx + w / 2, sy - roofHeight - 10);
}

function drawShopNPC(b, camX, camY) {
  const nx = b.npcX * TILE_SIZE - camX;
  const ny = b.npcY * TILE_SIZE - camY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(nx, ny + 4, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = b.npcColor;
  ctx.fillRect(nx - 10, ny - 18, 20, 20);

  // Head
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(nx - 9, ny - 32, 18, 15);

  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(nx - 5, ny - 25, 3, 4);
  ctx.fillRect(nx + 2, ny - 25, 3, 4);

  // Nameplate
  ctx.font = '16px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde047';
  ctx.fillText(b.npcName, nx, ny - 38);
}

function drawTreeProp(prop, camX, camY) {
  const sx = (prop.tx + 0.5) * TILE_SIZE - camX;
  const sy = (prop.ty + 0.8) * TILE_SIZE - camY;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(sx, sy, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#78350f';
  ctx.fillRect(sx - 6, sy - 26, 12, 26);

  if (prop.type === 'tree') {
    // Layered 2.5D canopy
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(sx, sy - 34, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(sx, sy - 44, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(sx - 4, sy - 50, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMonster(m, camX, camY) {
  const sx = m.x - camX;
  const sy = m.y - camY;
  const r = m.type.radius;
  const bounce = Math.abs(Math.sin(performance.now() * 0.006 + m.uid * 10)) * 5;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 6, r, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boss Aura
  if (m.type.isBoss) {
    ctx.strokeStyle = '#ff3e6c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4, r + 10, (r + 10) * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Volumetric 2.5D Body
  ctx.fillStyle = m.hurtTimer > 0 ? '#ffffff' : m.type.color;
  ctx.fillRect(sx - r, sy - r * 1.6 - bounce, r * 2, r * 1.8);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx - r, sy - r * 1.6 - bounce, r * 2, r * 1.8);

  // Eyes
  ctx.fillStyle = m.type.eyeColor;
  ctx.fillRect(sx - r * 0.5, sy - r * 1.0 - bounce, 5, 5);
  ctx.fillRect(sx + r * 0.2, sy - r * 1.0 - bounce, 5, 5);

  // Level & Name + HP Bar
  ctx.font = '15px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = m.type.isBoss ? '#ff3e6c' : '#fde68a';
  ctx.fillText(`Lv.${m.type.level} ${m.type.name}`, sx, sy - r * 1.9 - 12 - bounce);

  const barW = Math.max(38, r * 2.4);
  ctx.fillStyle = '#1e1b2e';
  ctx.fillRect(sx - barW / 2, sy - r * 1.9 - 8 - bounce, barW, 6);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(sx - barW / 2, sy - r * 1.9 - 8 - bounce, barW * Math.max(0, m.hp / m.maxHp), 6);
}

function drawPlayer(camX, camY) {
  const sx = player.x - camX;
  const sy = player.y - camY;
  const bob = Math.abs(Math.sin(player.walkAnim)) * 3;
  const st = getPlayerStats();

  // Full-Set Aura if wearing a 4/4 matching rarity armor set!
  if (st.activeSet) {
    ctx.strokeStyle = st.activeSet.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 5, 20, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 6, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots
  const bootsColor = player.equipment.boots ? RARITIES[ITEM_DB[player.equipment.boots.id].rarity].darkColor : '#451a03';
  ctx.fillStyle = bootsColor;
  ctx.fillRect(sx - 8, sy - 2, 6, 6);
  ctx.fillRect(sx + 2, sy - 2, 6, 6);

  // Leggings
  const legsColor = player.equipment.leggings ? RARITIES[ITEM_DB[player.equipment.leggings.id].rarity].color : '#1e3a8a';
  ctx.fillStyle = legsColor;
  ctx.fillRect(sx - 8, sy - 10 - bob, 16, 9);

  // Chestplate / Tunic
  const chestColor = player.equipment.chestplate ? RARITIES[ITEM_DB[player.equipment.chestplate.id].rarity].color : '#3b82f6';
  ctx.fillStyle = chestColor;
  ctx.fillRect(sx - 10, sy - 24 - bob, 20, 15);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx - 10, sy - 24 - bob, 20, 15);

  // Head
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(sx - 9, sy - 38 - bob, 18, 15);

  // Eyes based on facing direction
  ctx.fillStyle = '#111827';
  if (player.facing === 'down') {
    ctx.fillRect(sx - 5, sy - 31 - bob, 3, 4);
    ctx.fillRect(sx + 2, sy - 31 - bob, 3, 4);
  } else if (player.facing === 'left') {
    ctx.fillRect(sx - 7, sy - 31 - bob, 3, 4);
  } else if (player.facing === 'right') {
    ctx.fillRect(sx + 4, sy - 31 - bob, 3, 4);
  }

  // Helmet (if equipped) or Hero Hair
  if (player.equipment.helmet) {
    const helmRarity = RARITIES[ITEM_DB[player.equipment.helmet.id].rarity];
    ctx.fillStyle = helmRarity.color;
    ctx.fillRect(sx - 11, sy - 43 - bob, 22, 9);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(sx - 11, sy - 43 - bob, 22, 9);
  } else {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(sx - 10, sy - 41 - bob, 20, 6);
  }

  // Weapon / Pickaxe Swing Arc
  if (player.swingTimer > 0) {
    const progress = 1 - player.swingTimer / 0.24;
    const startAng = player.swingAngle - 0.9;
    const curAng = startAng + progress * 1.8;

    let swingColor = '#e2e8f0';
    if (player.equipment.weapon) {
      swingColor = ITEM_DB[player.equipment.weapon.id].bladeColor || '#fbbf24';
    } else if (player.equipment.tool) {
      swingColor = ITEM_DB[player.equipment.tool.id].headColor || '#38bdf8';
    }

    ctx.save();
    ctx.strokeStyle = swingColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(sx, sy - 16, 42, startAng, curAng);
    ctx.stroke();

    // Blade line
    ctx.beginPath();
    ctx.moveTo(sx, sy - 16);
    ctx.lineTo(sx + Math.cos(curAng) * 46, sy - 16 + Math.sin(curAng) * 46);
    ctx.stroke();
    ctx.restore();
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const camX = Math.round(player.x - canvas.width / 2);
  const camY = Math.round(player.y - canvas.height / 2);
  mouseWorldX = mouseScreenX + camX;
  mouseWorldY = mouseScreenY + camY;

  // 1. Ground Tiles
  drawGroundTiles(camX, camY);

  // 2. Tile Placement / Mining Target Highlight
  if (!isAnyModalOpen()) {
    const { tx, ty } = getTargetTileFromCursor();
    const dist = Math.hypot((tx + 0.5) * TILE_SIZE - player.x, (ty + 0.5) * TILE_SIZE - player.y);
    if (dist <= TILE_SIZE * 3.2) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx * TILE_SIZE - camX, ty * TILE_SIZE - camY, TILE_SIZE, TILE_SIZE);
    }
  }

  // 3. Collect all Y-sorted 2.5D Renderables (Blocks, Buildings, Trees, Ground Drops, Monsters, NPCs, Player)
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
        draw: () => drawTreeProp(prop, camX, camY)
      });
    }
  });

  groundDrops.forEach(d => {
    renderList.push({
      sortY: d.y,
      draw: () => {
        const sx = d.x - camX;
        const sy = d.y - camY - (d.z || 0);
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        const icon = d.type === 'gold' ? '🪙' : d.type === 'bone' ? '🦴' : '🎁';
        ctx.fillText(icon, sx, sy);
      }
    });
  });

  monsters.forEach(m => {
    renderList.push({
      sortY: m.y,
      draw: () => drawMonster(m, camX, camY)
    });
  });

  renderList.push({
    sortY: player.y,
    draw: () => drawPlayer(camX, camY)
  });

  // Sort back-to-front by Y coordinate for authentic Pokemon 2.5D depth occlusion!
  renderList.sort((a, b) => a.sortY - b.sortY);
  renderList.forEach(item => item.draw());

  // 4. Particles & Floating Combat Text
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
}

function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

// Initialize World, Monsters, and UI
generateWorld();
populateInitialMonsters();
updateHudUI();
updateHotbarUI();
showToast('🏡 Welcome to Oakhaven Village! Use your 100 Gold at the shops (press F near NPCs) to gear up!');
requestAnimationFrame(gameLoop);
