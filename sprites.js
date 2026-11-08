/**
 * VALORIA: 2.5D PIXEL ART ENGINE (sprites.js)
 * Zero-Emoji Authentic Pixel Art Generator:
 * - Grounded Hero & NPC 2.5D sprites (bottom of boots sits at exact bottom of canvas so shadows never float)
 * - Grounded Monster & Boss sprites (bottom of monster sits at exact bottom of canvas)
 * - Pixel-art Item Icons (Swords, Broadswords, Scythes, Hammers, Pickaxes, Helmets, Chestplates, Greaves, Boots, Potions, Chests, Coins, Bones, Blocks/Ores, UI Icons)
 * - Cached data-URI generator so HTML UI cards, Hotbar, HUD, and Canvas all use real pixel-art sprites!
 */

const SpriteEngine = (() => {
  const cache = new Map();
  const dataUrlCache = new Map();

  function createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    return { c, cx };
  }

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
  // 1. HERO & NPC 2.5D PIXEL SPRITES
  // Exact bottom-aligned (feet at row 17 = canvas bottom) so shadows sit right under the boots!
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
      wingsColor = null
    } = opts;

    const key = JSON.stringify(opts);
    if (cache.has(key)) return cache.get(key);

    const scale = 2.5;
    // 20 cols wide x 18 rows tall => bottom of boots is at y = 18 * scale (exact bottom edge!)
    const { c, cx } = createCanvas(20 * scale, 18 * scale);

    const palette = {
      'K': '#0f172a',
      'S': skin,
      's': '#d99b6c',
      'H': helmColor || hair,
      'h': helmColor ? helmTrim : '#3b220c',
      'W': '#ffffff',
      'E': '#0f172a',
      'C': chestColor,
      'c': chestDark,
      'L': legsColor,
      'B': bootsColor,
      'G': wingsColor || 'transparent'
    };

    if (wingsColor) {
      const wingMat = [
        "G..G............G..G",
        "GGGG.G........G.GGGG",
        ".GGGGG........GGGGG.",
        "..GGGG........GGGG..",
        "...GGG........GGG...",
        "....GG........GG...."
      ];
      drawPixelMatrix(cx, wingMat, palette, scale, 0, 6 * scale);
    }

    // Head (9 rows tall, drawn at row 0..8)
    let headMat;
    if (helmColor) {
      if (facing === 'up') {
        headMat = [
          "................",
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
          "................",
          "....KKKKKKK.....",
          "...KHHHHHHHHK...",
          "..KhhhHHHHHHHK..",
          "..KSSSHHHHHHHK..",
          "..KWEsHHHHHHHK..",
          "..KSSsHHHHHHK...",
          "...KSSSSSSSSK...",
          "....KKKKKKKK...."
        ];
      } else if (facing === 'right') {
        headMat = [
          "................",
          ".....KKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHhhhK..",
          "..KHHHHHHHSSSK..",
          "..KHHHHHHHsEWK..",
          "...KHHHHHHsSSK...",
          "...KSSSSSSSSK...",
          "....KKKKKKKK...."
        ];
      } else {
        headMat = [
          "................",
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
      if (facing === 'up') {
        headMat = [
          "................",
          "....KKKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHHHHK..",
          "..KHHHHHHHHHHK..",
          "..KhhhhhhhhhhK..",
          "...KhhhhhhhhK...",
          "....KSSSSSSK....",
          "....KKKKKKKK...."
        ];
      } else if (facing === 'left') {
        headMat = [
          "................",
          "....KKKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHHHHK..",
          "..KSSSHHHHHHHK..",
          "..KWEsHHHHHHK...",
          "..KSSsHHHHKK....",
          "...KSSSSSSK.....",
          "....KKKKKK......"
        ];
      } else if (facing === 'right') {
        headMat = [
          "................",
          "....KKKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHHHHK..",
          "..KHHHHHHHSSSK..",
          "...KHHHHHHsEWK..",
          "....KKHHHHsSSK..",
          ".....KSSSSSSK...",
          "......KKKKKK...."
        ];
      } else {
        headMat = [
          "................",
          "....KKKKKKKK....",
          "...KHHHHHHHHK...",
          "..KHHHHHHHHHHK..",
          "..KHHhSSSShHHK..",
          "..KHSWESSSEWSHK.",
          "...KSSSSSSSSSK..",
          "...KSSSSSSSSSK..",
          "....KKKKKKKKK..."
        ];
      }
    }

    // Body (9 rows tall, drawn at row 9..17 -> row 17 is exact bottom of canvas!)
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

    drawPixelMatrix(cx, headMat, palette, scale, 2 * scale, 0);
    drawPixelMatrix(cx, bodyMat, palette, scale, 2 * scale, 9 * scale);

    cache.set(key, c);
    return c;
  }

  // ==========================================
  // 2. MONSTER PIXEL ART SPRITES (Bottom-aligned so feet touch shadow)
  // ==========================================
  function getMonsterSprite(speciesId, color, secondaryColor, eyeColor, frame = 0, isHurt = false) {
    const key = `mon_${speciesId}_${color}_${secondaryColor}_${eyeColor}_${frame}_${isHurt}`;
    if (cache.has(key)) return cache.get(key);

    const scale = 2.6;
    const { c, cx } = createCanvas(16 * scale, 14 * scale);

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
        ".....KKKKKK.....",
        "...KKMMMMMMKK...",
        ".KKMWWMMMMMMMKK.",
        "KMMMEMMMMMMEMMmK",
        "KMMMMMMMMMMMMmmK",
        "KmmmmmmmmmmmmmmK",
        ".KKKKKKKKKKKKKK."
      ];
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
        ".KGGK......KGGK.",
        ".KKKK......KKKK."
      ];
    } else {
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
    }

    // Bottom-align matrix so last row touches bottom of canvas
    const startY = (14 - mat.length) * scale;
    drawPixelMatrix(cx, mat, palette, scale, 0, startY);

    cache.set(key, c);
    return c;
  }

  // ==========================================
  // 3. 2.5D WORLD PROP SPRITES (Bottom-aligned)
  // ==========================================
  function getPropSprite(type) {
    const key = `prop_${type}`;
    if (cache.has(key)) return cache.get(key);

    const scale = 3;
    const { c, cx } = createCanvas(18 * scale, 16 * scale);

    if (type === 'tree' || type === 'pine' || type === 'palm') {
      const palette = {
        'K': '#0c1910',
        'T': '#78350f',
        't': '#451a03',
        'G': type === 'pine' ? '#0f766e' : (type === 'palm' ? '#65a30d' : '#15803d'),
        'L': type === 'pine' ? '#14b8a6' : (type === 'palm' ? '#84cc16' : '#22c55e'),
        'H': type === 'pine' ? '#99f6e4' : '#bbf7d0'
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
      drawPixelMatrix(cx, mat, palette, scale, 0, (16 - mat.length) * scale);
    } else if (type === 'deadtree') {
      const palette = { 'K': '#09070f', 'T': '#4c1d95', 't': '#2e1065' };
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
      drawPixelMatrix(cx, mat, palette, scale, 1 * scale, (16 - mat.length) * scale);
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
      drawPixelMatrix(cx, mat, palette, scale, 4 * scale, (16 - mat.length) * scale);
    }

    cache.set(key, c);
    return c;
  }

  // ==========================================
  // 4. PIXEL-ART ITEM & UI ICON SPRITES (Replaces ALL emojis!)
  // ==========================================
  function getIconCanvas(iconKind, primaryColor = '#cbd5e1', secondaryColor = '#fbbf24') {
    const key = `icon_${iconKind}_${primaryColor}_${secondaryColor}`;
    if (cache.has(key)) return cache.get(key);

    const scale = 2;
    const { c, cx } = createCanvas(14 * scale, 14 * scale);
    const palette = {
      'K': '#090a10',
      'P': primaryColor,
      'S': secondaryColor,
      'W': '#ffffff',
      'B': '#78350f',
      'b': '#451a03',
      'G': '#fbbf24',
      'R': '#ef4444'
    };

    const matrices = {
      sword: [
        "..........KKK.",
        ".........KPPWK",
        "........KPPWPK",
        ".......KPPWPK.",
        "......KPPWPK..",
        "..KK.KPPWPK...",
        "..KSKPPWPK....",
        "...KSSPPK.....",
        "...KBSSSK.....",
        "..KBBKSK......",
        ".KBBK.KK......",
        "KSSK..........",
        "KKK...........",
        ".............."
      ],
      greatsword: [
        ".........KKKK.",
        "........KPPWWK",
        ".......KPPPWWK",
        "......KPPPWWK.",
        ".....KPPPWWK..",
        ".KK.KPPPWWK...",
        ".KSSKPPPWWK...",
        "..KSSSSPPK....",
        "...KBBSSSK....",
        "..KBBK.KSK....",
        ".KBBK...KK....",
        "KSSK..........",
        "KKK...........",
        ".............."
      ],
      pickaxe: [
        "....KKKKKK....",
        "..KKPPPPPPKK..",
        ".KPPWWWWPPPPK.",
        "KPPK..KKBKKPPK",
        "KKK....KBK.KKK",
        "......KBBK....",
        ".....KBBK.....",
        "....KBBK......",
        "...KBBK.......",
        "..KBBK........",
        ".KBBK.........",
        "KBBK..........",
        "KKK...........",
        ".............."
      ],
      helmet: [
        "..............",
        "..KK......KK..",
        ".KSSKKKKKKSSK.",
        ".KPPPPPPPPPPK.",
        ".KPPWWWWPPPPK.",
        ".KPPPPPPPPPPK.",
        ".KSSSSSSSSSSK.",
        ".KPPKKKKKKPPK.",
        ".KPPK....KPPK.",
        "..KK......KK..",
        "..............",
        "..............",
        "..............",
        ".............."
      ],
      chestplate: [
        "..............",
        ".KKKK....KKKK.",
        "KPPPPKKKKPPPPK",
        "KPPWWWWWWWWPPK",
        "KPPPPPPPPPPPPK",
        ".KPPSSSSSSPPK.",
        ".KPPPPPPPPPPK.",
        ".KPPSSSSSSPPK.",
        "..KPPPPPPPPK..",
        "..KSSSSSSSSK..",
        "...KKKKKKKK...",
        "..............",
        "..............",
        ".............."
      ],
      leggings: [
        "..............",
        "..KKKKKKKKKK..",
        "..KSSSSSSSSK..",
        "..KPPPPPPPPK..",
        "..KPPWWWWPPK..",
        "..KPPKKKKPPK..",
        "..KPPK..KPPK..",
        "..KPPK..KPPK..",
        "..KPPK..KPPK..",
        "..KSSK..KSSK..",
        "..KKKK..KKKK..",
        "..............",
        "..............",
        ".............."
      ],
      boots: [
        "..............",
        "..............",
        "..............",
        "..KKKK..KKKK..",
        "..KSSK..KSSK..",
        "..KPPK..KPPK..",
        "..KPPK..KPPK..",
        ".KPPPK.KPPPK..",
        "KPPPPK.KPPPPK.",
        "KSSSSK.KSSSSK.",
        "KKKKKK.KKKKKK.",
        "..............",
        "..............",
        ".............."
      ],
      potion: [
        "....KKKKKK....",
        "....KBBBBK....",
        ".....KWWK.....",
        "....KW..WK....",
        "...KW....WK...",
        "..KWPPPPPPWK..",
        ".KWPPWWWWPPWK.",
        ".KPPPPPPPPPPK.",
        ".KPPPPPPPPPPK.",
        "..KPPPPPPPPK..",
        "...KKKKKKKK...",
        "..............",
        "..............",
        ".............."
      ],
      chest: [
        "..............",
        "..KKKKKKKKKK..",
        ".KSSSSSSSSSSK.",
        "KPPPPPPPPPPPPK",
        "KSSSSSSSSSSSSK",
        "KPPPPKKKKPPPPK",
        "KPPPPKGGKPPPPK",
        "KPPPPKKKKPPPPK",
        "KPPPPPPPPPPPPK",
        "KSSSSSSSSSSSSK",
        ".KKKKKKKKKKKK.",
        "..............",
        "..............",
        ".............."
      ],
      block: [
        "..............",
        "..KKKKKKKKKK..",
        ".KPPPPPPPPPPK.",
        "KPPWWWWWWWWPPK",
        "KPPPPPPPPPPPPK",
        "KPPPPSSSSPPPPK",
        "KSSSSSSSSSSSSK",
        "KSSbbSSSSbbSSK",
        "KSSSSSSSSSSSSK",
        ".KSSSSSSSSSSK.",
        "..KKKKKKKKKK..",
        "..............",
        "..............",
        ".............."
      ],
      coin: [
        "..............",
        "....KKKKKK....",
        "..KKGGGGGGKK..",
        ".KGGWWWWGGGGK.",
        ".KGWGGGGGGGGK.",
        ".KGWGGKKGGGGK.",
        ".KGWGGKKGGGGK.",
        ".KGGGGGGGGGGK.",
        "..KKGGGGGGKK..",
        "....KKKKKK....",
        "..............",
        "..............",
        "..............",
        ".............."
      ],
      bone: [
        "..............",
        "..KKK....KKK..",
        ".KWWWK..KWWWK.",
        ".KWWWWKKWWWWK.",
        "..KKWWWWWWKK..",
        "....KWWWWK....",
        "....KWWWWK....",
        "..KKWWWWWWKK..",
        ".KWWWWKKWWWWK.",
        ".KWWWK..KWWWK.",
        "..KKK....KKK..",
        "..............",
        "..............",
        ".............."
      ],
      shield: [
        "..............",
        ".KKKKKKKKKKKK.",
        ".KSSSSSSSSSSK.",
        ".KSPPPPPPPPSK.",
        ".KSPPWPPPPPSK.",
        ".KSPPWWWWPPSK.",
        ".KSPPWPPPPPSK.",
        "..KSPPPPPPSK..",
        "...KSPPPPSK...",
        "....KSPPSK....",
        ".....KKKK.....",
        "..............",
        "..............",
        ".............."
      ],
      anvil: [
        "..............",
        "..............",
        ".KKKKKKKKKKKK.",
        "KPPPPWWWWPPPPK",
        "KPPPPPPPPPPPPK",
        ".KKKKPPPPKKKK.",
        "....KPPPPK....",
        "...KPPPPPPK...",
        "..KSSSSSSSSK..",
        ".KKKKKKKKKKKK.",
        "..............",
        "..............",
        "..............",
        ".............."
      ]
    };

    const mat = matrices[iconKind] || matrices.sword;
    drawPixelMatrix(cx, mat, palette, scale, 0, 0);

    cache.set(key, c);
    return c;
  }

  function getIconDataUrl(iconKind, primaryColor = '#cbd5e1', secondaryColor = '#fbbf24') {
    const key = `url_${iconKind}_${primaryColor}_${secondaryColor}`;
    if (dataUrlCache.has(key)) return dataUrlCache.get(key);
    const c = getIconCanvas(iconKind, primaryColor, secondaryColor);
    const url = c.toDataURL();
    dataUrlCache.set(key, url);
    return url;
  }

  function getIconHtml(iconKind, primaryColor, secondaryColor, size = 22) {
    const url = getIconDataUrl(iconKind, primaryColor, secondaryColor);
    return `<img src="${url}" class="pixel-icon" width="${size}" height="${size}" alt="" />`;
  }

  return {
    getCharacterSprite,
    getMonsterSprite,
    getPropSprite,
    getIconCanvas,
    getIconDataUrl,
    getIconHtml
  };
})();
