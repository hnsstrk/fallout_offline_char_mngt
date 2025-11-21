# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository stores offline character data for Fallout TTRPG campaigns using FoundryVTT (Foundry Virtual Tabletop). It contains exported character JSON files from the Fallout game system.

## Repository Structure

```
fallout_offline_char_mngt/
├── chars/              # Character JSON exports from FoundryVTT
│   └── fvtt-Actor-[character-name]-[id].json
├── LICENSE             # MIT License
└── README.md
```

## Character Data Format

Character files follow the FoundryVTT actor data structure with the naming convention:
`fvtt-Actor-[normalized-name]-[unique-id].json`

### Key Data Structure Components

Each character JSON contains:

- **Basic Info**: `name`, `type` (character), `img` (avatar path)
- **System Data**: Core game mechanics data including:
  - `attributes`: S.P.E.C.I.A.L. stats (str, per, end, cha, int, agi, luc)
  - `level`: Character level and XP tracking
  - `origin`: Character background (e.g., "Supermutant")
  - `body_parts`: Injury tracking for humanoid body parts (head, torso, armL/R, legL/R)
    - Each part tracks: injuries array, injury counts, resistance values, status
  - `health`: HP values and bonuses
  - `defense`, `initiative`, `meleeDamage`: Combat stats
  - `resistance`: Damage type resistances (physical, energy, poison, radiation)
  - `conditions`: Hunger, thirst, sleep, fatigue, intoxication tracking
  - `currency`: Caps and other currencies
  - `materials`: Crafting materials (junk, common, uncommon, rare)
  - `carryWeight`: Encumbrance tracking
  - `skill`: Skill tags and bonuses
  - `luckPoints`: Current luck points
  - `radiation`: Radiation level
  - `immunities`: Poison and radiation immunity flags

- **Items Array**: Character inventory, equipment, perks, skills, and weapons
- **PrototypeToken**: Token configuration for the VTT map
- **Effects**: Active effects on the character
- **Flags**: FoundryVTT module-specific data

### Character Files

Character files are large (2,000-6,000 lines, 68-186 KB) due to embedded item data. When reading character files, use `offset` and `limit` parameters to read specific sections.

## Working with Character Data

### Modifying Characters

When editing character data:
1. Parse the JSON carefully - maintain the exact structure
2. Use the Edit tool for targeted changes to avoid corrupting the file
3. Test JSON validity after modifications
4. Key modification areas:
   - Attribute values in `system.attributes.[attr].value`
   - Health in `system.health.value`
   - Currency in `system.currency.caps`
   - Character level in `system.level.value`
   - Conditions in `system.conditions.[condition]`

### Searching Character Data

- Use Grep to search across all characters for specific attributes or values
- Filter by character name using the filename pattern
- Search within `system` object for game mechanics
- Search within `items` array for inventory/equipment

## Git Workflow

This is a simple data repository:
- Main branch: `main`
- No build process or tests
- Commit changes to character files with descriptive messages
- Character file changes typically represent campaign progress or corrections

## License

MIT License - Copyright (c) 2025 Hans Stark
