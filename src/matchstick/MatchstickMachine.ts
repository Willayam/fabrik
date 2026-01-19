import Phaser from 'phaser';
import { MatchstickMachineConfig, LAYOUT } from './MatchstickTypes';
import { MatchstickBuffer } from './MatchstickBuffer';
import { gaussianRandom } from '../types';

export type MachineState = 'busy' | 'starved' | 'blocked';

export interface MachineUpdateResult {
    state: MachineState;
    itemCompleted: boolean;
}

export class MatchstickMachine extends Phaser.GameObjects.Container {
    public config: MatchstickMachineConfig;

    // Processing state
    public isProcessing: boolean = false;
    public processingTimeRemaining: number = 0;
    public currentProcessingTime: number = 0;
    public currentState: MachineState = 'starved';

    // Connected buffers
    public inputBuffer!: MatchstickBuffer;
    public outputBuffer!: MatchstickBuffer;

    // Buffer capacity for blocked detection (0 = unlimited)
    public outputBufferCapacity: number = 0;

    // Visual elements
    private machineBody: Phaser.GameObjects.Rectangle;
    private progressBg: Phaser.GameObjects.Rectangle;
    private progressBar: Phaser.GameObjects.Rectangle;
    private stationLabel: Phaser.GameObjects.Text;
    private statusText: Phaser.GameObjects.Text;
    private rateText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, stationIndex: number) {
        super(scene, x, y);

        this.config = {
            stationIndex,
            ratePerMinute: 6,
            variancePercent: 20,
        };

        // Machine body
        this.machineBody = scene.add.rectangle(0, 0, LAYOUT.MACHINE_WIDTH, LAYOUT.MACHINE_HEIGHT, 0x4a4a6a);
        this.machineBody.setStrokeStyle(3, 0x6a6a8a);
        this.add(this.machineBody);

        // Station number label
        this.stationLabel = scene.add.text(0, -5, `${stationIndex + 1}`, {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(this.stationLabel);

        // Progress bar background
        this.progressBg = scene.add.rectangle(0, LAYOUT.MACHINE_HEIGHT / 2 - 8, LAYOUT.MACHINE_WIDTH - 8, 6, 0x333333);
        this.add(this.progressBg);

        // Progress bar fill
        this.progressBar = scene.add.rectangle(
            -(LAYOUT.MACHINE_WIDTH - 8) / 2,
            LAYOUT.MACHINE_HEIGHT / 2 - 8,
            0,
            4,
            0x00ff88
        ).setOrigin(0, 0.5);
        this.add(this.progressBar);

        // Status text above machine
        this.statusText = scene.add.text(0, -LAYOUT.MACHINE_HEIGHT / 2 - 14, 'Idle', {
            fontSize: '10px',
            color: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.add(this.statusText);

        // Rate display below machine
        this.rateText = scene.add.text(0, LAYOUT.MACHINE_HEIGHT / 2 + 14, '6/min', {
            fontSize: '10px',
            color: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.add(this.rateText);

        scene.add.existing(this);
    }

    setBuffers(input: MatchstickBuffer, output: MatchstickBuffer): void {
        this.inputBuffer = input;
        this.outputBuffer = output;
    }

    setRate(rate: number): void {
        this.config.ratePerMinute = rate;
        this.rateText.setText(`${rate.toFixed(1)}/min`);
    }

    setVariance(variance: number): void {
        this.config.variancePercent = variance;
    }

    update(delta: number): MachineUpdateResult {
        let itemCompleted = false;

        if (this.isProcessing) {
            this.processingTimeRemaining -= delta;

            if (this.processingTimeRemaining <= 0) {
                // Check if output buffer is full (blocked)
                const isBlocked = this.outputBufferCapacity > 0 &&
                    this.outputBuffer.items >= this.outputBufferCapacity;

                if (isBlocked) {
                    // Can't output - stay blocked
                    this.processingTimeRemaining = 0;
                    this.currentState = 'blocked';
                } else {
                    // Processing complete - output to next buffer
                    this.outputBuffer.items++;
                    this.outputBuffer.updateVisual();
                    this.isProcessing = false;
                    this.processingTimeRemaining = 0;
                    itemCompleted = true;
                }
            } else {
                this.currentState = 'busy';
            }
        }

        // Try to start processing if not currently busy
        if (!this.isProcessing && this.inputBuffer.items > 0) {
            // Take item from input
            this.inputBuffer.items--;
            this.inputBuffer.updateVisual();

            // Calculate processing time with variance
            const baseTime = 60000 / this.config.ratePerMinute; // ms per item
            const variance = (this.config.variancePercent / 100) * baseTime;
            const actualTime = gaussianRandom(baseTime, variance);

            this.processingTimeRemaining = Math.max(100, actualTime); // Minimum 100ms
            this.currentProcessingTime = this.processingTimeRemaining;
            this.isProcessing = true;
            this.currentState = 'busy';
        } else if (!this.isProcessing) {
            // Not processing and no input available = starved
            this.currentState = 'starved';
        }

        this.updateVisual();

        return {
            state: this.currentState,
            itemCompleted,
        };
    }

    updateVisual(): void {
        if (this.isProcessing) {
            const progress = 1 - (this.processingTimeRemaining / this.currentProcessingTime);
            const barWidth = (LAYOUT.MACHINE_WIDTH - 8) * Math.max(0, Math.min(1, progress));
            this.progressBar.width = barWidth;
            this.machineBody.setStrokeStyle(3, 0x00ff88);
            this.statusText.setText('Processing');
            this.statusText.setColor('#00ff88');
        } else {
            this.progressBar.width = 0;

            if (this.inputBuffer.items > 0) {
                this.machineBody.setStrokeStyle(3, 0xffd93d);
                this.statusText.setText('Ready');
                this.statusText.setColor('#ffd93d');
            } else {
                this.machineBody.setStrokeStyle(3, 0x6a6a8a);
                this.statusText.setText('Idle');
                this.statusText.setColor('#888888');
            }
        }
    }

    reset(): void {
        this.isProcessing = false;
        this.processingTimeRemaining = 0;
        this.currentProcessingTime = 0;
        this.updateVisual();
    }
}
