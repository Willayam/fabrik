/**
 * GarageScene - Phase 1 main gameplay scene
 * The player manually operates machines to make brackets
 */

import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Machine } from '../entities/Machine';
import { Item } from '../entities/Item';
import { MachineConfig } from '../types';

// Machine configurations for Phase 1
const MACHINE_CONFIGS: MachineConfig[] = [
    {
        id: 'raw_bin',
        name: 'Raw Materials',
        processingTime: 0,
        variance: 0,
        inputType: null,
        outputType: 'raw_metal',
        requiresOperator: false,
        inputSlots: 0,
        outputSlots: 999,
        batchSize: 1,
    },
    {
        id: 'stamper',
        name: 'Stamper',
        processingTime: 15,   // Increased for batch
        variance: 3,         // Increased variance
        inputType: 'raw_metal',
        outputType: 'stamped_piece',
        requiresOperator: true,
        inputSlots: 3,
        outputSlots: 3,
        batchSize: 3,
    },
    {
        id: 'bender',
        name: 'Bender',
        processingTime: 25,   // Increased for batch
        variance: 5,
        inputType: 'stamped_piece',
        outputType: 'bracket',
        requiresOperator: true,
        inputSlots: 5,
        outputSlots: 5,
        batchSize: 5,
    },
    {
        id: 'sale_point',
        name: 'Sale',
        processingTime: 0,
        variance: 0,
        inputType: 'bracket',
        outputType: null,
        requiresOperator: false,
        inputSlots: 999,
        outputSlots: 0,
        batchSize: 1,
        salePrice: 50,
    },
];

// Machine colors
const MACHINE_COLORS: Record<string, number> = {
    raw_bin: 0x666666,
    stamper: 0xff6b6b,
    bender: 0x4ecdc4,
    sale_point: 0xffd93d,
};

export class GarageScene extends Phaser.Scene {
    private player!: Player;
    private machines: Machine[] = [];
    private rawMaterialBin!: Machine;
    private floorItems: Item[] = []; // Track items dropped on floor

    // Economy
    private throughput = 0;
    private inventoryCount = 0;

    constructor() {
        super({ key: 'GarageScene' });
    }

    create(): void {
        // Draw garage floor
        this.add.rectangle(640, 360, 1200, 640, 0x2d2d2d);
        this.add.rectangle(640, 360, 1180, 620, 0x3d3d3d).setStrokeStyle(2, 0x555555);

        // Create machines
        this.createMachines();

        // Create player
        this.player = new Player(this, 640, 450);

        // Spawn initial raw materials
        this.spawnRawMaterials(5);

        // Instructions
        this.add.text(640, 680, 'WASD move | E interact (pickup/drop/start machine)', {
            fontSize: '14px',
            color: '#888888',
        }).setOrigin(0.5);

        // Flow arrow hints
        this.add.text(260, 200, '→', { fontSize: '24px', color: '#555555' });
        this.add.text(460, 200, '→', { fontSize: '24px', color: '#555555' });
        this.add.text(660, 200, '→', { fontSize: '24px', color: '#555555' });
    }

    private createMachines(): void {
        const positions = [
            { x: 200, y: 250 },   // Raw materials
            { x: 400, y: 250 },   // Stamper
            { x: 600, y: 250 },   // Bender
            { x: 800, y: 250 },   // Sale point
        ];

        MACHINE_CONFIGS.forEach((config, index) => {
            const pos = positions[index];
            const color = MACHINE_COLORS[config.id];
            const machine = new Machine(this, pos.x, pos.y, config, color);
            this.machines.push(machine);

            if (config.id === 'raw_bin') {
                this.rawMaterialBin = machine;
            }
        });
    }

    private spawnRawMaterials(count: number): void {
        for (let i = 0; i < count; i++) {
            const item = new Item(
                this,
                this.rawMaterialBin.x + 70,
                this.rawMaterialBin.y,
                'raw_metal',
                { type: 'machine', machineId: 'raw_bin', slot: 'output', index: i }
            );
            item.setStackOffset(i);
            this.rawMaterialBin.outputQueue.push(item);
        }
        this.updateInventoryCount();
    }

    update(_time: number, delta: number): void {
        // Update player
        this.player.update(delta);

        // Find nearest machine
        let nearestMachine: Machine | null = null;
        let nearestDistance = Infinity;

        for (const machine of this.machines) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, machine.x, machine.y);
            if (distance < nearestDistance && distance < 120) {
                nearestDistance = distance;
                nearestMachine = machine;
            }
        }

        // Update machines (they now run independently!)
        for (const machine of this.machines) {
            const result = machine.update(delta);

            // Check for sales
            if (machine.config.id === 'sale_point' && result) {
                this.onSale(machine.config.salePrice || 50);
            }
        }

        // Handle E key press
        if (this.player.isPickupPressed()) {
            this.handleEKeyPress(nearestMachine);
        }

        // Update economy in UI scene
        this.updateUI();
    }

    /**
     * E key now does multiple things depending on context:
     * 1. If carrying item and near machine input -> drop item
     * 2. If not carrying and near machine with output -> pick up
     * 3. If not carrying and near floor item -> pick up
     * 4. If not carrying and near machine ready to start -> start machine
     */
    private handleEKeyPress(nearMachine: Machine | null): void {
        console.log('E pressed!', {
            nearMachine: nearMachine?.config.name,
            carrying: !!this.player.carriedItem,
            hasOutput: nearMachine?.hasOutput(),
            canStart: nearMachine?.canStart(),
            floorItems: this.floorItems.length
        });

        // Case 1: Carrying an item - try to drop
        if (this.player.carriedItem) {
            this.handleDrop(nearMachine);
            return;
        }

        // Case 2: Near a machine with output - pick up
        if (nearMachine && nearMachine.hasOutput()) {
            console.log('Picking up from machine output');
            this.handleMachinePickup(nearMachine);
            return;
        }

        // Case 3: Near a floor item - pick up
        const nearbyFloorItem = this.findNearbyFloorItem();
        if (nearbyFloorItem) {
            console.log('Picking up floor item');
            this.handleFloorPickup(nearbyFloorItem);
            return;
        }

        // Case 4: Near machine ready to start - start it
        if (nearMachine && nearMachine.canStart()) {
            console.log('Starting machine');
            nearMachine.startProcessing();
            return;
        }
    }

    private findNearbyFloorItem(): Item | null {
        for (const item of this.floorItems) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (distance < 60) {
                return item;
            }
        }
        return null;
    }

    private handleMachinePickup(machine: Machine): void {
        const item = machine.takeOutput();
        console.log('Took from machine:', item, 'outputQueue now:', machine.outputQueue.length);
        if (item && item.itemInfo) {
            const color = item.getColor();
            const itemData = { ...item.itemInfo };
            item.destroy();
            this.player.pickUp(itemData, color);
            console.log('Player now carrying:', this.player.carriedItem);
            this.updateInventoryCount();
        }
    }

    private handleFloorPickup(item: Item): void {
        // Remove from floor items array
        const index = this.floorItems.indexOf(item);
        if (index > -1) {
            this.floorItems.splice(index, 1);
        }

        const color = item.getColor();
        const itemData = { ...item.itemInfo };
        item.destroy();
        this.player.pickUp(itemData, color);
        this.updateInventoryCount();
    }

    private handleDrop(nearMachine: Machine | null): void {
        if (!this.player.carriedItem) return;

        // Try to drop into nearest machine
        if (nearMachine && nearMachine.hasInputRoom() && nearMachine.acceptsItemType(this.player.carriedItem.itemType)) {
            // Create new item at machine input
            const itemData = this.player.drop()!;
            const item = new Item(
                this,
                nearMachine.x - 70,
                nearMachine.y,
                itemData.itemType,
                { type: 'machine', machineId: nearMachine.config.id, slot: 'input', index: nearMachine.inputQueue.length }
            );
            nearMachine.addInput(item);
            this.updateInventoryCount();
            return;
        }

        // Drop on floor near player
        const itemData = this.player.drop()!;
        const item = new Item(
            this,
            this.player.x + Phaser.Math.Between(-30, 30),
            this.player.y + Phaser.Math.Between(-30, 30),
            itemData.itemType,
            { type: 'floor', zoneId: 'garage_floor', stackIndex: 0 }
        );
        this.floorItems.push(item); // Track the floor item!
        console.log('Dropped on floor, floorItems now:', this.floorItems.length);
        this.updateInventoryCount();
    }

    private onSale(amount: number): void {
        this.throughput += amount;

        // Visual feedback
        const text = this.add.text(800, 200, `+$${amount}`, {
            fontSize: '24px',
            color: '#00ff00',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: 150,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy(),
        });

        this.updateInventoryCount();

        // Respawn raw material
        this.spawnRawMaterials(1);
    }

    private updateInventoryCount(): void {
        let count = 0;

        // Count items in machine queues
        for (const machine of this.machines) {
            count += machine.inputQueue.length;
            count += machine.outputQueue.length;
        }

        // Count carried item
        if (this.player.carriedItem) {
            count++;
        }

        this.inventoryCount = count;
    }

    private updateUI(): void {
        const uiScene = this.scene.get('UIScene') as any;
        if (uiScene && uiScene.setThroughput) {
            uiScene.setThroughput(this.throughput);
            uiScene.setInventory(this.inventoryCount);
        }
    }
}
