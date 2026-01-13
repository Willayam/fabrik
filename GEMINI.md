# Fabrik - AI Assistant Context

> This file provides context for AI coding assistants working on this project.

## Project Overview

**Fabrik** is a factory simulation game that teaches manufacturing principles from Eliyahu Goldratt's "The Goal" and the Theory of Constraints.

**Core Concept:** "Inventory = Liability" — maximize Throughput while minimizing Inventory and Operating Expense.

## Tech Stack

- **Engine:** Phaser 3.70+ (2D game framework)
- **Language:** TypeScript
- **Build:** Vite
- **Package Manager:** Bun (for all dependency management and script execution)
- **No Physics Engine:** Uses slot-based item system, not Matter.js

## Architecture

### Project Structure
```
src/
├── main.ts                 # Phaser config & entry
├── scenes/
│   ├── BootScene.ts        # Asset preloading
│   ├── GarageScene.ts      # Phase 1 main scene
│   └── UIScene.ts          # HUD overlay
├── entities/
│   ├── Player.ts           # WASD movement + carry
│   ├── Machine.ts          # Processing + variance
│   └── Item.ts             # Simple sprite
├── systems/
│   ├── SimulationSystem.ts # Game clock
│   └── EconomySystem.ts    # T, I, OE tracking
└── config/
    └── machines.json       # Machine definitions
```

### Key Patterns

**Slot-Based Items:** Items exist in discrete locations, not physics bodies.
```typescript
type ItemLocation = 
  | { type: 'carried'; by: 'player' | WorkerId }
  | { type: 'machine'; machineId: string; slot: 'input' | 'output' }
  | { type: 'floor'; zoneId: string };
```

**Statistical Variance:** Machine processing uses Gaussian random.
```typescript
function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}
```

## Game Mechanics Summary

### Phase 1 (MVP) Machines
| Machine | Time | σ | Requires Operator |
|---------|------|---|-------------------|
| Stamper | 10s | 2s | Yes (hold SPACE) |
| Bender | 12s | 3s | Yes (hold SPACE) |

### Player Controls
- **WASD:** 8-directional movement
- **SPACE (hold):** Operate machine
- **E:** Pickup/drop item

### Economy Tracking
- **Throughput:** $ earned when goods are *sold* (not produced)
- **Inventory:** Items on floor + in machines (WIP count)
- **Operating Expense:** Fixed costs per shift

## Development Commands

```bash
# Install dependencies
bun install

# Run dev server (http://localhost:3000)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Development Guidelines

1. **Keep it simple:** No physics engine, use discrete slots
2. **Teach through gameplay:** The bottleneck should emerge naturally
3. **Progressive disclosure:** Lock advanced features behind progression
4. **Test the feel:** Variance values should make piles form intuitively
5. **Use Bun:** All package management and script execution uses Bun

## References

- [The Goal](https://en.wikipedia.org/wiki/The_Goal_(novel)) by Eliyahu Goldratt
- [Phaser 3 Documentation](https://phaser.io/docs)
- [Theory of Constraints](https://www.tocinstitute.org/theory-of-constraints.html)
