# ⚔️ Valoria: 2.5D Pixel Style RPG

A Pokemon-inspired **2.5D Oblique Top-Down Action RPG** built with HTML5 Canvas, Vanilla JavaScript, and CSS.

## 🌟 Key Features

- **Pokemon-Style 2.5D Perspective**: Classic oblique top-down camera where buildings have pitched roofs and front walls, blocks & ores have 3D vertical faces and top faces, and characters/trees/monsters are dynamically Y-depth sorted so you can walk behind roofs and in front of facades.
- **Village Spawn & 100 Starting Gold**: Spawn in **Oakhaven Village** with **100 Gold** to buy your initial Weapons, Pickaxes, Armor, and Health Potions before setting off on your journey.
- **3 Interactive Village Shops**:
  - **⚔️ Garrick's Ironheart Armory**: Buy Weapons and Armor across all 6 rarity tiers.
  - **🧪 Lyra's Starlight Emporium**: Buy Health Potions, Pickaxes, and Building Blocks, or sell your collected Monster Bones and Mined Ores for Gold.
  - **⚒️ Bram's Master Blacksmith**: Upgrade any Helmet, Chestplate, Leggings, or Boots from **+1 up to +50** using Gold!
- **6 Item Rarity Tiers**:
  - `Common` (Lv. 1+)
  - `Uncommon` (Lv. 3+)
  - `Rare` (Lv. 6+)
  - `Epic` (Lv. 10+)
  - `Legendary` (Lv. 15+)
  - `Mythic` (Lv. 20+)
- **Full-Set Armor Bonuses & Level Progression**: Wearing a full 4-piece set (`Helmet`, `Chestplate`, `Leggings`, `Boots`) of matching rarity activates a glowing character aura and grants massive set bonuses (Max HP, Bonus Attack %, Move Speed, Crit Chance, HP Regen, and Lifesteal). Level up by slaying monsters and mining ores to unlock higher-rarity armor!
- **Monster Combat, Bones & Difficulty-Scaled Loot Chests**: Slay monsters across 5 biomes (Whispering Wilds, Crystal Quarry, Shadowlands, and Dragon Peaks) to earn XP, Gold, Bones, and rare **Tiered Treasure Chests** whose loot table scales with how tough the defeated monster was—up to the **Mythic Abyssal Dragon Boss**!
- **Pickaxe Ore Mining & 2.5D Block Placement**: Equip pickaxes to mine Stone, Copper, Iron, Gold, Mythril, and Celestite ore blocks, and right-click (or press `B`) to place blocks anywhere in the world.

## 🎮 Controls

| Input | Action |
| :--- | :--- |
| **WASD / Arrow Keys** | Move character |
| **Left-Click / Spacebar** | Swing Weapon at monsters OR Mine Ores/Blocks with Pickaxe |
| **Right-Click / B** | Place selected block from inventory into the 2.5D world |
| **F** | Interact with Village Shopkeepers & Blacksmith |
| **1 - 8** | Use Hotbar slot (Drink Potions, Open Loot Chests, Select Blocks) |
| **I / E** | Open Hero Equipment & Inventory |
| **H** | Open Adventurer's Guide |

## 🚀 How to Run Locally

Open `index.html` directly in any modern browser, or serve the folder locally:

```bash
python3 -m http.server 8080
```
Then visit `http://localhost:8080`.
