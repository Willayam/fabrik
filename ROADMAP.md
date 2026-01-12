# Fabrik Development Roadmap

> A factory simulation game about **Flow**, not Capacity.  
> Inspired by Eliyahu Goldratt's "The Goal" and the Theory of Constraints.

**Last Updated:** 2026-01-12

---

## Core Philosophy

**"Inventory = Liability"** — Unlike typical factory games where idle machines are bad, Fabrik teaches that excess inventory (work-in-progress) kills cash flow and hides problems.

**The Three Measurements:**
| Metric | Goal |
|--------|------|
| **Throughput** | Maximize ($ from sales) |
| **Inventory** | Minimize ($ tied up in WIP) |
| **Operating Expense** | Minimize (wages, upkeep) |

---

## Phase 1: The Garage (MVP) 🏭

*"You are the bottleneck."*

**Setting:** Small garage. You're a subcontractor making Industrial Brackets.

### Core Mechanics
- [ ] Player movement (WASD, 8-directional)
- [ ] Manual machine operation (hold SPACE)
- [ ] Slot-based item system (carry 1 item)
- [ ] Statistical variance on processing time (Gaussian)
- [ ] Basic HUD (Throughput, Inventory, Shift Timer)

### Machines
| Machine | Process Time | Variance (σ) |
|---------|--------------|--------------|
| Stamper | 10s | 2s |
| Bender | 12s | 3s |

### Teaching Moment
> The Bender becomes the bottleneck. Piles form before it naturally.

---

## Phase 2: The Job Shop 👷

*"Managing variance and people."*

**Expansion:** Hire employees, larger floor, produce Hinges.

### New Mechanics
- [ ] Employee classes (Handler, Operator)
- [ ] Worker AI and task assignment
- [ ] Machine queuing behavior
- [ ] The "Herbie" effect visualization

### Teaching Moment
> Dependent events + statistical fluctuations = chaos unless managed.

---

## Phase 3: The Assembly Line 🤖

*"The trap of local efficiency."*

**Expansion:** Sub-assembly, produce Car Doors.

### New Mechanics
- [ ] Conveyor belts
- [ ] Machine upgrades (speed vs reliability)
- [ ] Wear and maintenance system
- [ ] Maintenance technician role

### Teaching Moment
> A faster machine before the bottleneck just creates more inventory.

---

## Phase 4: The Supply Chain 📦

*"Cash flow is king."*

**Expansion:** OEM manufacturing, produce Transmissions.

### New Mechanics
- [ ] Procurement interface
- [ ] Lead times and shipping costs
- [ ] Batch sizing decisions
- [ ] Warehousing (forklifts, pallet racks)

### Teaching Moment
> "Saving money" by buying bulk steel kills your business by tying up cash.

---

## Phase 5: The Smart Factory 🎯

*"Perfection and pull systems."*

**Expansion:** Full car assembly (Fabrik Model S).

### New Mechanics
- [ ] Pull systems (Kanban bin limits)
- [ ] Andon cords (quality control)
- [ ] Just-in-Time delivery coordination
- [ ] Near-zero inventory operation

### Teaching Moment
> Balance the line so perfectly that inventory is near zero, but flow never stops.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Engine | Phaser 3.70+ |
| Language | TypeScript |
| Build | Vite |
| Desktop | Electron |
| Mobile | Capacitor |

---

## Current Status

**Phase:** 0.5 - Project Initialization  
**Next:** Set up Phaser 3 + TypeScript + Vite project structure
