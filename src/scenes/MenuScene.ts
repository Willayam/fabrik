import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        // Background
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // Title
        this.add.text(640, 150, 'FABRIK', {
            fontSize: '64px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(640, 210, 'Factory Simulation', {
            fontSize: '18px',
            color: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Garage Simulation button
        this.createButton(
            640, 350,
            'GARAGE SIMULATION',
            'Manual player control - carry items between machines',
            0x4ecdc4,
            () => {
                this.scene.start('GarageScene');
                this.scene.launch('UIScene');
            }
        );

        // Matchstick Game button
        this.createButton(
            640, 480,
            'MATCHSTICK GAME',
            'Automated simulation - watch Theory of Constraints in action',
            0xff6b6b,
            () => {
                this.scene.start('MatchstickScene');
            }
        );

        // Footer
        this.add.text(640, 650, 'Learn Goldratt\'s Theory of Constraints through gameplay', {
            fontSize: '12px',
            color: '#555555',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    private createButton(
        x: number,
        y: number,
        label: string,
        description: string,
        color: number,
        onClick: () => void
    ): void {
        const btnWidth = 400;
        const btnHeight = 70;

        // Button background
        const btn = this.add.rectangle(x, y, btnWidth, btnHeight, color, 0.8)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', onClick)
            .on('pointerover', () => {
                btn.setFillStyle(color, 1);
                btn.setScale(1.02);
            })
            .on('pointerout', () => {
                btn.setFillStyle(color, 0.8);
                btn.setScale(1);
            });

        btn.setStrokeStyle(2, color);

        // Button label
        this.add.text(x, y - 10, label, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button description
        this.add.text(x, y + 15, description, {
            fontSize: '11px',
            color: '#dddddd',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}
