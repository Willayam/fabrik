/**
 * GarageScene - Phase 1 main gameplay scene
 */

import Phaser from 'phaser';

export class GarageScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

    private readonly PLAYER_SPEED = 150;

    constructor() {
        super({ key: 'GarageScene' });
    }

    create(): void {
        // Temporary: Draw garage floor
        this.add.rectangle(640, 360, 1200, 640, 0x3d3d3d);

        // Temporary: Create player as rectangle
        this.player = this.add.rectangle(640, 360, 32, 32, 0x00ff88);

        // Set up input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };

        // Temporary: Add placeholder machines
        this.add.rectangle(300, 300, 64, 64, 0xff6b6b).setStrokeStyle(2, 0xffffff);
        this.add.text(300, 340, 'STAMPER', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);

        this.add.rectangle(600, 300, 64, 64, 0x4ecdc4).setStrokeStyle(2, 0xffffff);
        this.add.text(600, 340, 'BENDER', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);

        this.add.rectangle(900, 300, 64, 64, 0xffd93d).setStrokeStyle(2, 0xffffff);
        this.add.text(900, 340, 'SALE', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);

        // Instructions
        this.add.text(640, 680, 'WASD to move | SPACE to operate machine | E to pickup/drop', {
            fontSize: '14px',
            color: '#888888',
        }).setOrigin(0.5);
    }

    update(): void {
        // Handle player movement
        let vx = 0;
        let vy = 0;

        if (this.wasd.A.isDown || this.cursors.left.isDown) vx = -1;
        if (this.wasd.D.isDown || this.cursors.right.isDown) vx = 1;
        if (this.wasd.W.isDown || this.cursors.up.isDown) vy = -1;
        if (this.wasd.S.isDown || this.cursors.down.isDown) vy = 1;

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.x += vx * this.PLAYER_SPEED * (this.game.loop.delta / 1000);
        this.player.y += vy * this.PLAYER_SPEED * (this.game.loop.delta / 1000);
    }
}
