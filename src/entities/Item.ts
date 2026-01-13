/**
 * Item Entity - Represents a physical item in the factory
 */

import Phaser from 'phaser';
import { ItemData, ItemType, ItemLocation, generateId } from '../types';

// Color mapping for item types
const ITEM_COLORS: Record<ItemType, number> = {
    raw_metal: 0x888888,
    stamped_piece: 0xff6b6b,
    bracket: 0x4ecdc4,
};

export class Item extends Phaser.GameObjects.Container {
    // Renamed from 'data' to avoid conflict with Phaser.GameObject.data
    public itemInfo: ItemData;
    private sprite: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, x: number, y: number, itemType: ItemType, location: ItemLocation) {
        super(scene, x, y);

        this.itemInfo = {
            id: generateId('item'),
            itemType,
            location,
        };

        // Create item sprite
        const color = ITEM_COLORS[itemType];
        this.sprite = scene.add.rectangle(0, 0, 24, 24, color);
        this.sprite.setStrokeStyle(1, 0xffffff);
        this.add(this.sprite);

        scene.add.existing(this);
    }

    // Get the color for this item type
    getColor(): number {
        return ITEM_COLORS[this.itemInfo.itemType];
    }

    // Update location
    setItemLocation(location: ItemLocation): void {
        this.itemInfo.location = location;
    }

    // Visual update for stacking in pile zones
    setStackOffset(index: number): void {
        // Offset items slightly for visual stacking effect
        this.sprite.x = (index % 3) * 8 - 8;
        this.sprite.y = Math.floor(index / 3) * -8;
    }
}

// Static helper to get color for item type
export function getItemColor(itemType: ItemType): number {
    return ITEM_COLORS[itemType];
}
