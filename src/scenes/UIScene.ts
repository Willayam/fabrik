/**
 * UIScene - HUD overlay (runs parallel to game scene)
 */

import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    private throughputText!: Phaser.GameObjects.Text;
    private inventoryText!: Phaser.GameObjects.Text;
    private shiftText!: Phaser.GameObjects.Text;

    // Economy state (will be moved to EconomySystem later)
    private throughput = 0;
    private inventory = 0;
    private shiftTimeRemaining = 480; // 8 minutes = 8 in-game hours

    constructor() {
        super({ key: 'UIScene' });
    }

    create(): void {
        // HUD Background
        this.add.rectangle(640, 30, 600, 50, 0x000000, 0.7);

        // Throughput
        this.add.text(400, 20, 'THROUGHPUT', { fontSize: '10px', color: '#888888' });
        this.throughputText = this.add.text(400, 35, '$0', { fontSize: '18px', color: '#00ff88' });

        // Inventory
        this.add.text(580, 20, 'INVENTORY', { fontSize: '10px', color: '#888888' });
        this.inventoryText = this.add.text(580, 35, '0 items', { fontSize: '18px', color: '#ff6b6b' });

        // Shift Timer
        this.add.text(760, 20, 'SHIFT', { fontSize: '10px', color: '#888888' });
        this.shiftText = this.add.text(760, 35, '8:00', { fontSize: '18px', color: '#ffd93d' });
    }

    update(_time: number, delta: number): void {
        // Update shift timer
        this.shiftTimeRemaining -= delta / 1000;
        if (this.shiftTimeRemaining < 0) this.shiftTimeRemaining = 0;

        const minutes = Math.floor(this.shiftTimeRemaining / 60);
        const seconds = Math.floor(this.shiftTimeRemaining % 60);
        this.shiftText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

        // Update economy display (placeholder)
        this.throughputText.setText(`$${this.throughput}`);
        this.inventoryText.setText(`${this.inventory} items`);
    }

    // Public methods for other scenes to update economy
    addThroughput(amount: number): void {
        this.throughput += amount;
    }

    setInventory(count: number): void {
        this.inventory = count;
    }
}
