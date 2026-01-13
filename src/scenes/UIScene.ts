/**
 * UIScene - HUD overlay (runs parallel to game scene)
 */

import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    private throughputText!: Phaser.GameObjects.Text;
    private inventoryText!: Phaser.GameObjects.Text;
    private shiftText!: Phaser.GameObjects.Text;
    private throughputDelta!: Phaser.GameObjects.Text;

    // Economy state
    private throughput = 0;
    private inventory = 0;
    private shiftTimeRemaining = 480; // 8 minutes = 8 in-game hours
    private lastThroughput = 0;

    constructor() {
        super({ key: 'UIScene' });
    }

    create(): void {
        // HUD Background
        this.add.rectangle(640, 35, 700, 60, 0x000000, 0.8).setStrokeStyle(1, 0x333333);

        // Throughput Section
        this.add.text(350, 15, 'THROUGHPUT', { fontSize: '10px', color: '#666666' });
        this.throughputText = this.add.text(350, 32, '$0', {
            fontSize: '22px',
            color: '#00ff88',
            fontStyle: 'bold',
        });
        this.throughputDelta = this.add.text(420, 35, '', {
            fontSize: '14px',
            color: '#00ff00',
        });

        // Inventory Section
        this.add.text(550, 15, 'INVENTORY', { fontSize: '10px', color: '#666666' });
        this.inventoryText = this.add.text(550, 32, '0 items', {
            fontSize: '22px',
            color: '#ff6b6b',
            fontStyle: 'bold',
        });

        // Shift Timer Section
        this.add.text(750, 15, 'SHIFT', { fontSize: '10px', color: '#666666' });
        this.shiftText = this.add.text(750, 32, '8:00', {
            fontSize: '22px',
            color: '#ffd93d',
            fontStyle: 'bold',
        });

        // Goal reminder
        this.add.text(640, 75, 'Goal: Maximize Throughput • Minimize Inventory', {
            fontSize: '11px',
            color: '#555555',
        }).setOrigin(0.5);
    }

    update(_time: number, delta: number): void {
        // Update shift timer
        this.shiftTimeRemaining -= delta / 1000;
        if (this.shiftTimeRemaining < 0) {
            this.shiftTimeRemaining = 0;
            this.onShiftEnd();
        }

        const minutes = Math.floor(this.shiftTimeRemaining / 60);
        const seconds = Math.floor(this.shiftTimeRemaining % 60);
        this.shiftText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

        // Color code shift timer
        if (this.shiftTimeRemaining < 60) {
            this.shiftText.setColor('#ff0000');
        } else if (this.shiftTimeRemaining < 120) {
            this.shiftText.setColor('#ff9900');
        }

        // Update economy display
        this.throughputText.setText(`$${this.throughput}`);
        this.inventoryText.setText(`${this.inventory} items`);

        // Color code inventory (higher = worse)
        if (this.inventory > 15) {
            this.inventoryText.setColor('#ff0000');
        } else if (this.inventory > 10) {
            this.inventoryText.setColor('#ff9900');
        } else {
            this.inventoryText.setColor('#ff6b6b');
        }
    }

    private onShiftEnd(): void {
        // TODO: Show end of shift summary
        // For now, just reset
        this.shiftTimeRemaining = 480;
    }

    // Public methods for GarageScene to update
    setThroughput(amount: number): void {
        if (amount > this.throughput) {
            const delta = amount - this.throughput;
            this.showDelta(delta);
        }
        this.throughput = amount;
    }

    setInventory(count: number): void {
        this.inventory = count;
    }

    private showDelta(amount: number): void {
        this.throughputDelta.setText(`+$${amount}`);
        this.throughputDelta.setAlpha(1);

        this.tweens.add({
            targets: this.throughputDelta,
            alpha: 0,
            duration: 1500,
        });
    }
}
