# Fabrik

> A factory simulation game about **Flow**, not Capacity.

Fabrik teaches manufacturing principles from Eliyahu Goldratt's "The Goal" through hands-on gameplay. Learn why **Inventory = Liability** and discover the power of identifying and managing bottlenecks.

![Phase 1 MVP](https://img.shields.io/badge/Phase-1%20MVP-blue) ![Built with Phaser](https://img.shields.io/badge/Phaser-3.70-blueviolet) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![Bun](https://img.shields.io/badge/Bun-latest-orange)

---

## 🎮 Quick Start

### Prerequisites
- [Bun](https://bun.sh) (latest version)

### Installation

```bash
# Clone the repository
cd fabrik

# Install dependencies
bun install

# Start development server
bun run dev
```

The game will open at `http://localhost:3000/`

---

## 🎯 Core Concepts

### The Three Measurements

| Metric | Goal | In-Game |
|--------|------|---------|
| **Throughput** | Maximize | $ earned from *sales* |
| **Inventory** | Minimize | Items sitting on floor/in machines |
| **Operating Expense** | Minimize | Worker wages, machine upkeep |

### Phase 1: The Garage

You're a solo operator in a small garage making industrial brackets. You'll quickly discover that you can't be everywhere at once.

**Controls:**
- `WASD` - Move player
- `SPACE` (hold) - Operate machine
- `E` - Pickup/drop item

---

## 🛠 Tech Stack

- **Engine:** [Phaser 3.70+](https://phaser.io/)
- **Language:** TypeScript
- **Build:** Vite
- **Package Manager:** Bun
- **Architecture:** Slot-based item system (no physics engine)

---

## 📁 Project Structure

```
fabrik/
├── src/
│   ├── main.ts                 # Entry point
│   ├── scenes/                 # Phaser scenes
│   ├── entities/               # Game entities (Player, Machine, Item)
│   ├── systems/                # Game systems (Simulation, Economy)
│   ├── components/             # Entity components
│   └── config/                 # JSON configurations
├── assets/                     # Sprites, audio, tilemaps
├── ROADMAP.md                  # Development roadmap
└── GEMINI.md                   # AI assistant context
```

---

## 🚀 Available Commands

```bash
# Development
bun run dev          # Start dev server with hot reload
bun run build        # Build for production
bun run preview      # Preview production build

# Type checking
bun tsc              # Run TypeScript compiler
```

---

## 🗺 Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full development plan.

- [x] **Phase 0:** Project initialization
- [ ] **Phase 1:** The Garage (MVP) - Manual operation
- [ ] **Phase 2:** The Job Shop - Hire workers, manage variance
- [ ] **Phase 3:** The Assembly Line - Automation & maintenance
- [ ] **Phase 4:** The Supply Chain - Cash flow management
- [ ] **Phase 5:** The Smart Factory - Lean manufacturing perfection

---

## 🎓 Learning Resources

This game is inspired by:
- [The Goal](https://en.wikipedia.org/wiki/The_Goal_(novel)) by Eliyahu Goldratt
- [Theory of Constraints](https://www.tocinstitute.org/theory-of-constraints.html)

The core gameplay teaches:
- **Dependent Events** - Each step depends on the previous
- **Statistical Fluctuations** - Variance creates unpredictable behavior
- **The Herbie Effect** - The slowest link dictates total output
- **Local vs. Global Optimization** - Fast machines before the bottleneck create waste

---

## 🤖 AI Assistant Context

For AI coding assistants working on this project, see [GEMINI.md](./GEMINI.md) for architectural patterns, key mechanics, and development guidelines.

---

## 📝 License

MIT © 2026
