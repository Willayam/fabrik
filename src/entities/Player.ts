/**
 * Player Entity - Handles movement and item carrying
 */

import Phaser from 'phaser';
import { ItemData } from '../types';

export class Player extends Phaser.GameObjects.Container {
    private sprite: Phaser.GameObjects.Rectangle;
    private carriedItemSprite: Phaser.GameObjects.Rectangle | null = null;

    // Movement
    private readonly SPEED = 150;
    private readonly CARRY_SPEED_PENALTY = 0.8;

    // State
    public carriedItem: ItemData | null = null;
    public isOperating: boolean = false;

    // Input
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private eKey!: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // Create player body sprite
        this.sprite = scene.add.rectangle(0, 0, 32, 32, 0x00ff88);
        this.add(this.sprite);

        // Set up input
        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.wasd = {
            W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
        this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.eKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        scene.add.existing(this);
    }

    update(delta: number): void {
        // Handle movement
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

        // Apply speed (slower when carrying)
        const speed = this.carriedItem ? this.SPEED * this.CARRY_SPEED_PENALTY : this.SPEED;
        this.x += vx * speed * (delta / 1000);
        this.y += vy * speed * (delta / 1000);

        // Clamp to bounds (garage floor)
        this.x = Phaser.Math.Clamp(this.x, 60, 1220);
        this.y = Phaser.Math.Clamp(this.y, 60, 660);

        // Update operating state
        this.isOperating = this.spaceKey.isDown;

        // Visual feedback for operating
        this.sprite.setFillStyle(this.isOperating ? 0xffff00 : 0x00ff88);
    }

    // Check if E key was just pressed
    isPickupPressed(): boolean {
        return Phaser.Input.Keyboard.JustDown(this.eKey);
    }

    // Pick up an item
    pickUp(item: ItemData, color: number): void {
        this.carriedItem = item;

        // Show carried item above player
        this.carriedItemSprite = this.scene.add.rectangle(0, -24, 20, 20, color);
        this.add(this.carriedItemSprite);
    }

    // Drop the carried item
    drop(): ItemData | null {
        const item = this.carriedItem;
        this.carriedItem = null;

        if (this.carriedItemSprite) {
            this.carriedItemSprite.destroy();
            this.carriedItemSprite = null;
        }

        return item;
    }

    // Check if player is near a point
    isNear(x: number, y: number, radius: number = 50): boolean {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);
        return distance <= radius;
    }
}
