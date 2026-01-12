/**
 * BootScene - Asset preloading and initialization
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload(): void {
        // Show loading progress
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(440, 340, 400, 40);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffd700, 1);
            progressBar.fillRect(450, 350, 380 * value, 20);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });

        // TODO: Load assets here
        // this.load.image('player', 'assets/sprites/player.png');
        // this.load.image('machine-stamper', 'assets/sprites/stamper.png');
        // this.load.image('item-raw', 'assets/sprites/item-raw.png');
    }

    create(): void {
        // Start the game scene
        this.scene.start('GarageScene');
        this.scene.launch('UIScene');
    }
}
