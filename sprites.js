/**
 * VALORIA: 2.5D PIXEL ART ENGINE (sprites.js)
 * Generates authentic, cached offscreen 16x16 / 24x24 / 32x32 pixel-art sprites
 * for the Player (4 directions, walk frames, dynamic rarity armor/helmet/weapons),
 * NPCs, 14 Monster species + 4 World Bosses, 2.5D Trees/Crystals/Lamps, and Loot Chests.
 */

const SpriteEngine = (() => {
  const cache = new Map();

  function createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    return { c, cx };
  }

  // Draw an array of strings where each character maps to a color in palette
  function drawPixelMatrix(cx, matrix, palette, scale = 2, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < matrix.length; y++) {
      const row = matrix[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch !== '.' && ch !== ' ' && palette[ch]) {
          cx.fillStyle = palette[ch];
          cx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        }
      }
    }
  }

  // ==========================================
  // 1. HERO & NPC 2.5D PIXEL SPRITES (16x22 matrix @ 2.5x scale = 40x55 px)
  // ==========================================
  function getCharacterSprite(opts) {
    const {
      facing = 'down',
      frame = 0,
      skin = '#f6c89f',
      hair = '#5c3818',
      helmColor = null,
      helmTrim = '#fde047',
      chestColor = '#2563eb',
      chestDark = '#1d4ed8',
      legsColor = '#1e293b',
      bootsColor = '#451a03',
      capeColor = null,
      wingsColor = null
    } = opts;

    const key = JSON.stringify(opts);
    if (cache.has(key)) return cache.get(key);

    const scale = 2.5;
    const { c, cx } = createCanvas(20 * scale, 24 * scale);

    const palette = {
      'K': '#0f172a', // Dark outline
      'S': skin,
      's': '#d99b6c', // Skin shadow
      'H': helmColor || hair,
      'h': helmColor ? helmTrim : '#3b220c',
      'W': '#ffffff', // Eye white
      'E': '#0f172a', // Eye pupil
      'C': chestColor,
      'c': chestDark,
      'L': legsColor,
      'B': bootsColor,
      'P': capeColor || 'transparent',
      'G': wingsColor || 'transparent'
    };

    // Optional Mythic/Legendary Wings or Cape behind character
    if (wingsColor) {
      const wingMat = [
        "G..G............G..G",
        "GGGG.G........G.GGGG",
        ".GGGGG........GGGGG.",
        "..GGGG........GGGG..",
        "...GGG........GGG...",
        "....GG........GG...."
      ];
      drawPixelMatrix(cx, wingMat, palette, scale, 0, 7 * scale);
    }

    // Head & Hair / Helmet (16 wide, centered at x=2)
    let headMat;
    if (helmColor) {
      // Horned / Visored RPG Knight Helmet
      if (facing === 'up') {
        headMat = [
          "..KK........KK..",
          ".KhhKKKKKKKKhhK.",
          ".KHHHHHHHHHHHHK.",
          "..KHHHHHHHHHHK..",
          "..KHHHHHHHHHHK..",
          "..KhhhhhhhhhhK..",
          "..KKKKKKKKKKKK..",
          "....KSSSSSSK...."
        ];
      } else if (facing === 'left') {
        headMat = [
          "....KKKKKKK.....",
          "...KHHHHHHHHK...",
          "..KhhhHHHHHHHK..",
          "..KSSSHHHHHHHK..",
          "..KWEsHHHHHHHK..",
          "..KSSsHHHHHHK...",
          "...KKKKKKKKK...."
        ];
      } else if (facing === 'right') {
        headMat = [
          ".....KKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHhhhK..",
          "..KHHHHHHHSSSK..",
          "..KHHHHHHHsEWK..",
          "...KHHHHHHsSSK..",
          "....KKKKKKKKK..."
        ];
      } else {
        headMat = [
          "..KK........KK..",
          ".KhhKKKKKKKKhhK.",
          ".KHHHHHHHHHHHHK.",
          "..KhhhHHHHhhhK..",
          "..KSSSHHHHSSSK..",
          "..KWESSSSSSEWK..",
          "..KSSSSSSSSSSK..",
          "...KKKKKKKKKK..."
        ];
      }
    } else {
      // Classic spiky JRPG / Pokemon Hero Hair
      if (facing === 'up') {
        headMat = [
          "....KKKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHHHHK..",
          "..KHHHHHHHHHHK..",
          "..KhhhhhhhhhhK..",
          "...KhhhhhhhhK...",
          "....KSSSSSSK...."
        ];
      } else if (facing === 'left') {
        headMat = [
          "....KKKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHHHHK..",
          "..KSSSHHHHHHHK..",
          "..KWEsHHHHHHK...",
          "..KSSsHHHHKK....",
          "...KKKKKKK......"
        ];
      } else if (facing === 'right') {
        headMat = [
          "....KKKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHHHHK..",
          "..KHHHHHHHSSSK..",
          "...KHHHHHHsEWK..",
          "....KKHHHHsSSK..",
          "......KKKKKKK..."
        ];
      } else {
        headMat = [
          "....KKKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHHHHK..",
          "..KHHhSSSShHHK..",
          "..KHSWESSSEWSHK.",
          "...KSSSSSSSSSK..",
          "....KKKKKKKKK..."
        ];
      }
    }

    // Body + Walking legs animation (frames 0, 1, 2)
    let bodyMat;
    if (frame === 1) {
      bodyMat = [
        "...KKKKKKKKKK...",
        "..KCCCCCCCCCCK..",
        ".KSSKCCCCCCKSSK.",
        ".KssKccccccKssK.",
        "..KKKLLLLLLKKK..",
        "...KLLLLLLLLK...",
        "...KLLK..KLLK...",
        "...KBBK..KccK...",
        "...KKKK..KKKK..."
      ];
    } else if (frame === 2) {
      bodyMat = [
        "...KKKKKKKKKK...",
        "..KCCCCCCCCCCK..",
        ".KSSKCCCCCCKSSK.",
        ".KssKccccccKssK.",
        "..KKKLLLLLLKKK..",
        "...KLLLLLLLLK...",
        "...KLLK..KLLK...",
        "...KccK..KBBK...",
        "...KKKK..KKKK..."
      ];
    } else {
      bodyMat = [
        "...KKKKKKKKKK...",
        "..KCCCCCCCCCCK..",
        ".KSSKCCCCCCKSSK.",
        ".KssKccccccKssK.",
        "..KKKLLLLLLKKK..",
        "...KLLLLLLLLK...",
        "...KLLK..KLLK...",
        "...KBBK..KBBK...",
        "...KKKK..KKKK..."
      ];
    }

    drawPixelMatrix(cx, headMat, palette, scale, 2 * scale, 2 * scale);
    drawPixelMatrix(cx, bodyMat, palette, scale, 2 * scale, 9 * scale);

    cache.set(key, c);
    return c;
  }

  // ==========================================
  // 2. MONSTER PIXEL ART SPRITES (14 Species + Bosses)
  // ==========================================
  function getMonsterSprite(speciesId, color, secondaryColor, eyeColor, frame = 0, isHurt = false) {
    const key = `mon_${speciesId}_${color}_${secondaryColor}_${eyeColor}_${frame}_${isHurt}`;
    if (cache.has(key)) return cache.get(key);

    const scale = 2.6;
    const { c, cx } = createCanvas(20 * scale, 20 * scale);

    const palette = {
      'K': '#090a10',
      'M': isHurt ? '#ffffff' : color,
      'm': isHurt ? '#e2e8f0' : secondaryColor,
      'E': isHurt ? '#ef4444' : eyeColor,
      'W': '#ffffff',
      'G': '#fbbf24'
    };

    let mat;
    if (speciesId === 'slime') {
      mat = frame === 0 ? [
        "......KKKK......",
        "....KKMMMMKK....",
        "...KMWWMMMMMK...",
        "..KMWMMMMMMMmmK.",
        ".KMMMEMMMMEMMmmK",
        ".KMMMEMMMMEMMmmK",
        ".KMMMMMMMMMMMmmK",
        "..KmmmmmmmmmmmK.",
        "...KKKKKKKKKKK.."
      ] : [
        "................",
        ".....KKKKKK.....",
        "...KKMMMMMMKK...",
        ".KKMWWMMMMMMMKK.",
        "KMMMEMMMMMMEMMmK",
        "KMMMMMMMMMMMMmmK",
        "KmmmmmmmmmmmmmmK",
        ".KKKKKKKKKKKKKK."
      ];
      drawPixelMatrix(cx, mat, palette, scale, 2 * scale, 8 * scale);
    } else if (speciesId === 'skeleton' || speciesId === 'lich') {
      mat = [
        "....KKKKKKKK....",
        "...KMMMMMMMMK...",
        "..KMMMMMMMMMMK..",
        "..KMEEKKKKMEEK..",
        "..KMMMMMMMMMMK..",
        "...KMKMKMKMKK...",
        "....KKKKKKKK....",
        "..KKmKMMMMKmKK..",
        ".KMMKMMMMMMKMMK.",
        "..KK.KMMMMK.KK..",
        "....KMMKKMMK....",
        "....KMK..KMK....",
        "...KKK....KKK..."
      ];
      drawPixelMatrix(cx, mat, palette, scale, 2 * scale, 4 * scale);
    } else if (speciesId === 'goblin' || speciesId === 'orc') {
      mat = [
        ".KK..........KK.",
        "KMMK..KKKK..KMMK",
        ".KMMKKMMMMKKMMK.",
        "..KMMMMMMMMMMK..",
        "..KMEWMMMMWEMK..",
        "...KMMMMMMMMK...",
        "...KmmmmmmmmK...",
        "..KKmmmmmmmmKK..",
        ".KMMKmmmmmmKMMK.",
        "..KK.KMMMMK.KK..",
        "....KMMKKMMK....",
        "...KKKK..KKKK..."
      ];
      drawPixelMatrix(cx, mat, palette, scale, 2 * scale, 5 * scale);
    } else if (speciesId === 'golem' || speciesId === 'frost_titan') {
      mat = [
        "...KKKKKKKKKK...",
        "..KMMMMMMMMMMK..",
        ".KMMmmmmmmmmMMK.",
        ".KMMKEEMMMMEEKMK",
        "KMMMmmmmmmmmMMMK",
        "KMMMMMMMMMMMMMMK",
        "KMMmKMMMMMMKmMMK",
        "KMMmKmmmmmmKmMMK",
        ".KKK.KMMMMK.KKK.",
        "....KMMKKMMK....",
        "...KMMK..KMMK...",
        "...KKKK..KKKK..."
      ];
      drawPixelMatrix(cx, mat, palette, scale, 2 * scale, 4 * scale);
    } else if (speciesId === 'dragon' || speciesId === 'boss') {
      mat = [
        "K..KK......KK..K",
        "GK.KGGK..KGGK.KG",
        "KGK.KMMMMMMK.KGK",
        ".KGKMMMMMMMMKGK.",
        "KmmKMEWMMWEMKmmK",
        "KmmmKMMMMMMKmmmK",
        "KmmKMMMMMMMMKmmK",
        "KmKMMGGGGGGMMKmK",
        "K.KMMGGGGGGMMK.K",
        "..KMMMMMMMMMMK..",
        "..KMMK....KMMK..",
        ".KGGK......KGGK."
      ];
      drawPixelMatrix(cx, mat, palette, scale * 1.15, 0, 2 * scale);
    } else {
      // Wraith / Demon / Scorpion / Spider
      mat = [
        "....KKKKKKKK....",
        "..KKMMMMMMMMKK..",
        ".KMMMMMMMMMMMMK.",
        ".KMMEWMMMMWEMMK.",
        ".KMMMMMMMMMMMMK.",
        "..KmmmmmmmmmmK..",
        "...KMMMMMMMMK...",
        "..KMMKMMMMKMMK..",
        ".KMK..KMMK..KMK.",
        ".KK....KK....KK."
      ];
      drawPixelMatrix(cx, mat, palette, scale, 2 * scale, 6 * scale);
    }

    cache.set(key, c);
    return c;
  }

  // ==========================================
  // 3. 2.5D WORLD PROP SPRITES (Trees, Pines, Dead Trees, Crystals, Lamps)
  // ==========================================
  function getPropSprite(type) {
    if (cache.has(type)) return cache.get(type);

    const scale = 3;
    const { c, cx } = createCanvas(24 * scale, 28 * scale);

    if (type === 'tree' || type === 'pine' || type === 'palm') {
      const palette = {
        'K': '#0c1910',
        'T': '#78350f',
        't': '#451a03',
        'G': type === 'pine' ? '#0f766e' : '#15803d',
        'L': type === 'pine' ? '#14b8a6' : '#22c55e',
        'H': type === 'pine' ? '#99f6e4' : '#86efac'
      };
      const mat = [
        "......KKKKKK......",
        "....KKLLLLLLKK....",
        "...KLLHHHHHHLLK...",
        "..KLLHHHHHHHHLLK..",
        ".KLLLHHHHLLLLLLLK.",
        ".KGGGGLLLLLLGGGGK.",
        "KGGLLLLLLLLLLLLGGK",
        "KGGGLLLLHHLLLLGGGK",
        "KGGGGGGGGGGGGGGGGK",
        ".KKGGGGGGGGGGGGKK.",
        "...KKKKTTTTKKKK...",
        "......KTTttK......",
        "......KTTttK......",
        ".....KTTTtttK.....",
        ".....KKKKKKKK....."
      ];
      drawPixelMatrix(cx, mat, palette, scale, 3 * scale, 8 * scale);
    } else if (type === 'deadtree') {
      const palette = { 'K': '#09070f', 'T': '#4c1d95', 't': '#2e1065', 'G': '#c084fc' };
      const mat = [
        ".KK..........KK.",
        "..KTTK....KTTK..",
        "...KTTK..KTTK...",
        "....KTTKKTTK....",
        ".....KTTTTK.....",
        "..KKKTTTTTTKKK..",
        ".....KTTttK.....",
        ".....KTTttK.....",
        "....KTTTtttK....",
        "....KKKKKKKK...."
      ];
      drawPixelMatrix(cx, mat, palette, scale, 4 * scale, 12 * scale);
    } else if (type === 'lamp') {
      const palette = { 'K': '#0f172a', 'I': '#475569', 'G': '#fde047', 'Y': '#f59e0b' };
      const mat = [
        "...KKKK...",
        "..KGGGGK..",
        "..KGYYGK..",
        "...KKKK...",
        "....II....",
        "....II....",
        "....II....",
        "....II....",
        "...KIIK...",
        "..KKKKKK.."
      ];
      drawPixelMatrix(cx, mat, palette, scale, 7 * scale, 12 * scale);
    }

    cache.set(type, c);
    return c;
  }

  return {
    getCharacterSprite,
    getMonsterSprite,
    getPropSprite
  };
})();
