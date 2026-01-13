/**
 * Machine Entity - Processing station with "Start and Walk Away" model
 * 
 * States:
 * - idle: No input, nothing to do
 * - ready_to_start: Has input, waiting for player to press E
 * - processing: Running independently (player can walk away)
 * - output_ready: Processing done, output waiting for pickup
 * - blocked: Output slot full, can't complete
 */

import Phaser from 'phaser';
import { MachineConfig, MachineState, gaussianRandom, ItemType } from '../types';
import { Item } from './Item';

export class Machine extends Phaser.GameObjects.Container {
    public config: MachineConfig;
    public state: MachineState = 'idle';

    // Slots
    public inputQueue: Item[] = [];
    public outputQueue: Item[] = [];
    private processingBatch: Item[] = [];

    // Processing
    private processingTimeRemaining: number = 0;
    private currentProcessingTime: number = 0;

    // Visuals (renamed to avoid Phaser property conflicts)
    private machineBody: Phaser.GameObjects.Rectangle;
    private progressBar: Phaser.GameObjects.Rectangle;
    private progressBg: Phaser.GameObjects.Rectangle;
    private stateText: Phaser.GameObjects.Text;
    private nameText: Phaser.GameObjects.Text;
    private inputIndicator: Phaser.GameObjects.Rectangle;
    private outputIndicator: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, x: number, y: number, config: MachineConfig, color: number) {
        super(scene, x, y);

        this.config = config;

        // Machine body
        this.machineBody = scene.add.rectangle(0, 0, 80, 80, color);
        this.machineBody.setStrokeStyle(3, 0xffffff);
        this.add(this.machineBody);

        // Name label
        this.nameText = scene.add.text(0, 50, config.name.toUpperCase(), {
            fontSize: '11px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add(this.nameText);

        // State indicator
        this.stateText = scene.add.text(0, -50, '', {
            fontSize: '12px',
            color: '#ffff00',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add(this.stateText);

        // Progress bar background
        this.progressBg = scene.add.rectangle(0, 30, 60, 8, 0x333333);
        this.add(this.progressBg);

        // Progress bar
        this.progressBar = scene.add.rectangle(-30, 30, 0, 6, 0x00ff00);
        this.progressBar.setOrigin(0, 0.5);
        this.add(this.progressBar);

        // Input indicator (left side)
        this.inputIndicator = scene.add.rectangle(-50, 0, 16, 16, 0x333333);
        this.inputIndicator.setStrokeStyle(1, 0x666666);
        this.add(this.inputIndicator);

        // Output indicator (right side)
        this.outputIndicator = scene.add.rectangle(50, 0, 16, 16, 0x333333);
        this.outputIndicator.setStrokeStyle(1, 0x666666);
        this.add(this.outputIndicator);

        // Hide progress bar initially
        this.progressBg.setVisible(false);
        this.progressBar.setVisible(false);

        scene.add.existing(this);
    }

    /**
     * Main update loop - called every frame
     * Returns completed item if a sale happened (for sale_point only)
     */
    update(delta: number): Item | null {
        let completedItem: Item | null = null;

        // Special case: Raw material bin (infinite source)
        if (this.config.id === 'raw_bin') {
            return null;
        }

        // Special case: Sale point (instant sale)
        if (this.config.id === 'sale_point') {
            if (this.inputQueue.length > 0) {
                completedItem = this.inputQueue.shift()!;
                completedItem.destroy();
                return completedItem;
            }
            return null;
        }

        // State machine
        switch (this.state) {
            case 'idle':
                // Check if we have input
                if (this.inputQueue.length >= this.config.batchSize) {
                    this.state = 'ready_to_start';
                }
                break;

            case 'ready_to_start':
                // Waiting for player to press E - handled externally via startProcessing()
                if (this.inputQueue.length === 0) {
                    this.state = 'idle'; // Input was removed
                }
                break;

            case 'processing':
                // Machine runs independently!
                this.processingTimeRemaining -= delta / 1000;

                if (this.processingTimeRemaining <= 0) {
                    // Check if output has room for the whole batch
                    if (this.outputQueue.length + this.processingBatch.length <= this.config.outputSlots) {
                        this.completeProcessing();
                    } else {
                        this.state = 'blocked';
                    }
                }
                break;

            case 'output_ready':
                // Waiting for player to take output
                if (this.outputQueue.length === 0) {
                    // Output was taken - check if we can start next item
                    if (this.inputQueue.length >= this.config.batchSize && this.processingBatch.length === 0) {
                        this.state = 'ready_to_start';
                    } else {
                        this.state = 'idle';
                    }
                }
                // Stay in output_ready while there's output waiting!
                break;

            case 'blocked':
                // Output is full, waiting for pickup
                if (this.outputQueue.length + this.processingBatch.length <= this.config.outputSlots) {
                    this.completeProcessing();
                }
                break;
        }

        this.updateVisuals();
        return completedItem;
    }

    /**
     * Player presses E to start processing
     * Returns true if processing started
     */
    startProcessing(): boolean {
        if (this.state !== 'ready_to_start') {
            return false;
        }

        if (this.inputQueue.length < this.config.batchSize) {
            return false;
        }

        // Move batch from input queue to processing
        for (let i = 0; i < this.config.batchSize; i++) {
            const item = this.inputQueue.shift()!;
            item.setVisible(false);
            this.processingBatch.push(item);
        }

        // Calculate processing time with variance
        this.currentProcessingTime = gaussianRandom(this.config.processingTime, this.config.variance);
        this.processingTimeRemaining = this.currentProcessingTime;

        this.state = 'processing';
        this.progressBg.setVisible(true);
        this.progressBar.setVisible(true);

        return true;
    }

    private completeProcessing(): void {
        // Clear processed items
        this.processingBatch.forEach(item => item.destroy());
        this.processingBatch = [];

        // Create new items with output type matches batch size
        for (let i = 0; i < this.config.batchSize; i++) {
            if (this.config.outputType) {
                const newItem = new Item(
                    this.scene,
                    this.x + 70,
                    this.y,
                    this.config.outputType!,
                    { type: 'machine', machineId: this.config.id, slot: 'output', index: this.outputQueue.length }
                );

                // Visual stack offset
                newItem.setStackOffset(this.outputQueue.length);

                this.outputQueue.push(newItem);
            }
        }

        this.state = 'output_ready';
        this.progressBg.setVisible(false);
        this.progressBar.setVisible(false);
    }

    private updateVisuals(): void {
        switch (this.state) {
            case 'idle':
                if (this.inputQueue.length > 0) {
                    this.stateText.setText(`${this.inputQueue.length}/${this.config.batchSize}`);
                    this.stateText.setColor('#888888');
                } else {
                    this.stateText.setText('');
                }
                this.machineBody.setStrokeStyle(3, 0xffffff);
                break;

            case 'ready_to_start':
                this.stateText.setText(`▶ START (${this.inputQueue.length}/${this.config.batchSize})`);
                this.stateText.setColor('#ffff00');
                this.machineBody.setStrokeStyle(3, 0xffff00);
                break;

            case 'processing':
                const remaining = Math.ceil(this.processingTimeRemaining);
                this.stateText.setText(`${remaining}s`);
                this.stateText.setColor('#00ff00');
                this.machineBody.setStrokeStyle(3, 0x00ff00);
                break;

            case 'output_ready':
                this.stateText.setText('✓ DONE');
                this.stateText.setColor('#00ffff');
                this.machineBody.setStrokeStyle(3, 0x00ffff);
                break;

            case 'blocked':
                this.stateText.setText('⚠ BLOCKED');
                this.stateText.setColor('#ff0000');
                this.machineBody.setStrokeStyle(3, 0xff0000);
                break;
        }

        // Update progress bar
        if (this.state === 'processing' && this.currentProcessingTime > 0) {
            const progress = 1 - (this.processingTimeRemaining / this.currentProcessingTime);
            this.progressBar.width = 60 * progress;
        }

        // Update input/output slot indicators
        this.inputIndicator.setFillStyle(this.inputQueue.length > 0 ? 0x00ff00 : 0x333333);
        this.outputIndicator.setFillStyle(this.outputQueue.length > 0 ? 0x00ff00 : 0x333333);
    }

    // Add item to input queue
    addInput(item: Item): boolean {
        if (this.inputQueue.length >= this.config.inputSlots) {
            return false;
        }

        if (this.config.inputType && item.itemInfo.itemType !== this.config.inputType) {
            return false;
        }

        item.setPosition(this.x - 70, this.y);
        item.setItemLocation({ type: 'machine', machineId: this.config.id, slot: 'input', index: this.inputQueue.length });
        item.setStackOffset(this.inputQueue.length);
        this.inputQueue.push(item);
        return true;
    }

    // Take item from output queue
    takeOutput(): Item | null {
        if (this.outputQueue.length === 0) {
            return null;
        }

        const item = this.outputQueue.shift()!;

        // Update stack offsets for remaining items
        this.outputQueue.forEach((remainingItem, index) => {
            remainingItem.setStackOffset(index);
            remainingItem.itemInfo.location = {
                type: 'machine',
                machineId: this.config.id,
                slot: 'output',
                index: index
            };
        });

        // If state was blocked or output_ready, move to appropriate next state
        if (this.state === 'blocked') {
            // Can now complete the blocked item
        } else if (this.state === 'output_ready' && this.outputQueue.length === 0) {
            if (this.inputQueue.length > 0) {
                this.state = 'ready_to_start';
            } else {
                this.state = 'idle';
            }
        }

        return item;
    }

    // Check if machine can be started by player
    canStart(): boolean {
        return this.state === 'ready_to_start';
    }

    // Check if machine accepts this item type
    acceptsItemType(itemType: ItemType): boolean {
        return this.config.inputType === itemType || this.config.inputType === null;
    }

    hasInputRoom(): boolean {
        return this.inputQueue.length < this.config.inputSlots;
    }

    hasOutput(): boolean {
        return this.outputQueue.length > 0;
    }
}
