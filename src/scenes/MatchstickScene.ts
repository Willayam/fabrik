import Phaser from 'phaser';
import { MatchstickMachine } from '../matchstick/MatchstickMachine';
import { MatchstickBuffer } from '../matchstick/MatchstickBuffer';
import { SIMULATION_CONFIG, LAYOUT } from '../matchstick/MatchstickTypes';
import { MetricsTracker } from '../matchstick/MatchstickMetrics';
import { Slider } from '../ui/Slider';

export class MatchstickScene extends Phaser.Scene {
    // Simulation state
    private isRunning: boolean = false;
    private elapsedTime: number = 0;

    // Metrics
    private metricsTracker!: MetricsTracker;
    // FIFO queue for lead time: stores entry times of items currently in system
    private itemEntryTimes: number[] = [];
    private completedLeadTimes: number[] = [];

    // Cash tracking
    private currentCash: number = 0;
    private totalRevenue: number = 0;
    private totalMaterialCost: number = 0;
    private totalOperatingCost: number = 0;
    private isGameOver: boolean = false;

    // Cash UI elements
    private cashDisplayText!: Phaser.GameObjects.Text;
    private cashDisplayBg!: Phaser.GameObjects.Rectangle;
    private cashPulseTween: Phaser.Tweens.Tween | null = null;
    private bufferCostTexts: Phaser.GameObjects.Text[] = [];
    private gameOverOverlay!: Phaser.GameObjects.Rectangle;
    private gameOverText!: Phaser.GameObjects.Text;
    private gameOverSubtext!: Phaser.GameObjects.Text;

    // Entities
    private machines: MatchstickMachine[] = [];
    private buffers: MatchstickBuffer[] = [];
    private rateSliders: Slider[] = [];
    private varianceSliders: Slider[] = [];

    // UI Elements - Top stats
    private startStopBtn!: Phaser.GameObjects.Rectangle;
    private startStopText!: Phaser.GameObjects.Text;
    private elapsedText!: Phaser.GameObjects.Text;

    // UI Elements - Metrics Panel (global metrics only)
    private throughputText!: Phaser.GameObjects.Text;
    private throughputRateText!: Phaser.GameObjects.Text;
    private wipText!: Phaser.GameObjects.Text;
    private leadTimeAvgText!: Phaser.GameObjects.Text;
    private leadTimeP50Text!: Phaser.GameObjects.Text;
    private leadTimeP90Text!: Phaser.GameObjects.Text;

    // Per-station metrics displays (positioned on machines)
    private stationUtilBars: Phaser.GameObjects.Rectangle[] = [];
    private stationUtilBarBgs: Phaser.GameObjects.Rectangle[] = [];
    private stationUtilTexts: Phaser.GameObjects.Text[] = [];
    private stationThroughputTexts: Phaser.GameObjects.Text[] = [];

    // Per-buffer metrics displays (on buffers themselves)
    private bufferOnAvgTexts: Phaser.GameObjects.Text[] = [];
    private bufferOnMaxTexts: Phaser.GameObjects.Text[] = [];

    constructor() {
        super({ key: 'MatchstickScene' });
    }

    create(): void {
        this.metricsTracker = new MetricsTracker(
            SIMULATION_CONFIG.NUM_STATIONS,
            SIMULATION_CONFIG.NUM_BUFFERS
        );

        this.createBackground();
        this.createTitle();
        this.createBuffers();
        this.createMachines();
        this.createFlowArrows();
        this.createSliders();
        this.createStationMetricsOnMachines();
        this.createBufferMetricsOnBuffers();
        this.createControlButtons();
        this.createMetricsPanel();
        this.createBackButton();
        this.createCashDisplay();
        this.createBufferCostOverlays();
        this.createGameOverOverlay();
        this.initializeSimulation();
    }

    private createBackground(): void {
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);
    }

    private createTitle(): void {
        this.add.text(400, LAYOUT.TITLE_Y, 'MATCHSTICK GAME', {
            fontSize: '22px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, LAYOUT.TITLE_Y + 20, 'Theory of Constraints Simulation', {
            fontSize: '11px',
            color: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    private createBuffers(): void {
        for (let i = 0; i < SIMULATION_CONFIG.NUM_BUFFERS; i++) {
            const isSource = i === 0;
            const isSink = i === SIMULATION_CONFIG.NUM_BUFFERS - 1;
            const buffer = new MatchstickBuffer(
                this,
                LAYOUT.BUFFER_X[i],
                LAYOUT.MACHINES_Y,
                i,
                isSource,
                isSink
            );
            this.buffers.push(buffer);
        }
    }

    private createMachines(): void {
        for (let i = 0; i < SIMULATION_CONFIG.NUM_STATIONS; i++) {
            const machine = new MatchstickMachine(
                this,
                LAYOUT.STATION_X[i],
                LAYOUT.MACHINES_Y,
                i
            );
            machine.setBuffers(this.buffers[i], this.buffers[i + 1]);
            this.machines.push(machine);
        }
    }

    private createFlowArrows(): void {
        const arrowY = LAYOUT.MACHINES_Y;
        const arrowColor = 0x444466;

        for (let i = 0; i < SIMULATION_CONFIG.NUM_BUFFERS - 1; i++) {
            const startX = LAYOUT.BUFFER_X[i] + LAYOUT.BUFFER_WIDTH / 2 + 5;
            const endX = LAYOUT.STATION_X[i] - LAYOUT.MACHINE_WIDTH / 2 - 5;

            this.add.line(0, 0, startX, arrowY, endX, arrowY, arrowColor).setLineWidth(2);
            this.add.triangle(endX, arrowY, endX - 8, arrowY - 5, endX - 8, arrowY + 5, arrowColor);

            const machineEndX = LAYOUT.STATION_X[i] + LAYOUT.MACHINE_WIDTH / 2 + 5;
            const nextBufferX = LAYOUT.BUFFER_X[i + 1] - LAYOUT.BUFFER_WIDTH / 2 - 5;

            this.add.line(0, 0, machineEndX, arrowY, nextBufferX, arrowY, arrowColor).setLineWidth(2);
            this.add.triangle(nextBufferX, arrowY, nextBufferX - 8, arrowY - 5, nextBufferX - 8, arrowY + 5, arrowColor);
        }
    }

    private createSliders(): void {
        for (let i = 0; i < SIMULATION_CONFIG.NUM_STATIONS; i++) {
            const machine = this.machines[i];
            const x = LAYOUT.STATION_X[i];

            // Rate slider with format "6.0/min"
            const rateSlider = new Slider(this, {
                x,
                y: LAYOUT.SLIDERS_RATE_Y,
                width: LAYOUT.SLIDER_WIDTH,
                height: LAYOUT.SLIDER_HEIGHT,
                minValue: SIMULATION_CONFIG.MIN_RATE,
                maxValue: SIMULATION_CONFIG.MAX_RATE,
                initialValue: SIMULATION_CONFIG.DEFAULT_RATE_PER_MINUTE,
                formatLabel: (value: number) => [value.toFixed(1), '/min'],
                onChange: (value) => machine.setRate(value)
            });
            this.rateSliders.push(rateSlider);

            // Variance slider with format "+-20%"
            const varianceSlider = new Slider(this, {
                x,
                y: LAYOUT.SLIDERS_VARIANCE_Y,
                width: LAYOUT.SLIDER_WIDTH,
                height: LAYOUT.SLIDER_HEIGHT,
                minValue: SIMULATION_CONFIG.MIN_VARIANCE,
                maxValue: SIMULATION_CONFIG.MAX_VARIANCE,
                initialValue: SIMULATION_CONFIG.DEFAULT_VARIANCE_PERCENT,
                formatLabel: (value: number) => [`±${Math.round(value)}`, '%'],
                onChange: (value) => machine.setVariance(value)
            });
            this.varianceSliders.push(varianceSlider);
        }
    }

    private createStationMetricsOnMachines(): void {
        // Position metrics below each machine, above the sliders
        const metricsY = LAYOUT.MACHINES_Y + 75;
        const barWidth = 50;
        const barHeight = 8;

        for (let i = 0; i < SIMULATION_CONFIG.NUM_STATIONS; i++) {
            const x = LAYOUT.STATION_X[i];

            // Utilization bar background
            const utilBarBg = this.add.rectangle(x, metricsY, barWidth, barHeight, 0x333333);
            utilBarBg.setStrokeStyle(1, 0x555555);
            this.stationUtilBarBgs.push(utilBarBg);

            // Utilization bar fill (starts at 0 width)
            const utilBar = this.add.rectangle(
                x - barWidth / 2,
                metricsY,
                0,
                barHeight - 2,
                0x00ff88
            ).setOrigin(0, 0.5);
            this.stationUtilBars.push(utilBar);

            // Utilization percentage text (overlaid on bar)
            const utilText = this.add.text(x, metricsY, '0%', {
                fontSize: '8px',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.stationUtilTexts.push(utilText);

            // Throughput text (items/min actually processed)
            const throughputText = this.add.text(x, metricsY + 14, '0.0/min', {
                fontSize: '9px',
                color: '#4ecdc4',
                fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.stationThroughputTexts.push(throughputText);
        }
    }

    private createBufferMetricsOnBuffers(): void {
        // Position metrics below each intermediate buffer (not source or sink)
        const metricsY = LAYOUT.MACHINES_Y + 75;

        for (let i = 1; i < SIMULATION_CONFIG.NUM_BUFFERS - 1; i++) {
            const x = LAYOUT.BUFFER_X[i];

            // Average queue length
            const avgText = this.add.text(x, metricsY, 'Ø0.0', {
                fontSize: '9px',
                color: '#4ecdc4',
                fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.bufferOnAvgTexts.push(avgText);

            // Max queue length
            const maxText = this.add.text(x, metricsY + 12, '↑0', {
                fontSize: '9px',
                color: '#ff6b6b',
                fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.bufferOnMaxTexts.push(maxText);
        }
    }

    private createControlButtons(): void {
        // Elapsed time display
        this.add.text(700, 25, 'ELAPSED:', {
            fontSize: '11px',
            color: '#888888',
            fontFamily: 'monospace'
        });

        this.elapsedText = this.add.text(760, 25, '0:00', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        });

        // Start/Stop button
        this.startStopBtn = this.add.rectangle(860, 30, 80, 28, 0x00ff88)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.toggleSimulation())
            .on('pointerover', () => this.startStopBtn.setFillStyle(0x00cc66))
            .on('pointerout', () => this.startStopBtn.setFillStyle(this.isRunning ? 0xff6b6b : 0x00ff88));

        this.startStopText = this.add.text(860, 30, 'START', {
            fontSize: '12px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Reset button
        const resetBtn = this.add.rectangle(950, 30, 70, 28, 0x666688)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.resetSimulation())
            .on('pointerover', () => resetBtn.setFillStyle(0x7777aa))
            .on('pointerout', () => resetBtn.setFillStyle(0x666688));

        this.add.text(950, 30, 'RESET', {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    private createMetricsPanel(): void {
        const panelX = 1020;
        const panelY = 70;
        const lineHeight = 18;

        // Panel background
        this.add.rectangle(panelX + 110, 300, 240, 400, 0x000000, 0.5)
            .setStrokeStyle(1, 0x333355);

        // Panel title
        this.add.text(panelX, panelY, 'METRICS', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        });

        let y = panelY + 30;

        // 1. THROUGHPUT
        this.add.text(panelX, y, 'THROUGHPUT', {
            fontSize: '10px',
            color: '#666688',
            fontFamily: 'monospace'
        });
        y += lineHeight - 4;

        this.add.text(panelX, y, 'Shipped:', { fontSize: '10px', color: '#888888', fontFamily: 'monospace' });
        this.throughputText = this.add.text(panelX + 100, y, '0', {
            fontSize: '12px',
            color: '#00ff88',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        });
        y += lineHeight;

        this.add.text(panelX, y, 'Rate:', { fontSize: '10px', color: '#888888', fontFamily: 'monospace' });
        this.throughputRateText = this.add.text(panelX + 100, y, '0.0/min', {
            fontSize: '12px',
            color: '#00ff88',
            fontFamily: 'monospace'
        });
        y += lineHeight + 8;

        // 2. WIP
        this.add.text(panelX, y, 'WORK IN PROGRESS', {
            fontSize: '10px',
            color: '#666688',
            fontFamily: 'monospace'
        });
        y += lineHeight - 4;

        this.add.text(panelX, y, 'Total WIP:', { fontSize: '10px', color: '#888888', fontFamily: 'monospace' });
        this.wipText = this.add.text(panelX + 100, y, '0', {
            fontSize: '12px',
            color: '#ffd93d',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        });
        y += lineHeight + 8;

        // 3. LEAD TIME
        this.add.text(panelX, y, 'LEAD TIME', {
            fontSize: '10px',
            color: '#666688',
            fontFamily: 'monospace'
        });
        y += lineHeight - 4;

        this.add.text(panelX, y, 'Average:', { fontSize: '10px', color: '#888888', fontFamily: 'monospace' });
        this.leadTimeAvgText = this.add.text(panelX + 100, y, '-', {
            fontSize: '11px',
            color: '#4ecdc4',
            fontFamily: 'monospace'
        });
        y += lineHeight;

        this.add.text(panelX, y, 'P50:', { fontSize: '10px', color: '#888888', fontFamily: 'monospace' });
        this.leadTimeP50Text = this.add.text(panelX + 100, y, '-', {
            fontSize: '11px',
            color: '#4ecdc4',
            fontFamily: 'monospace'
        });
        y += lineHeight;

        this.add.text(panelX, y, 'P90:', { fontSize: '10px', color: '#888888', fontFamily: 'monospace' });
        this.leadTimeP90Text = this.add.text(panelX + 100, y, '-', {
            fontSize: '11px',
            color: '#ff6b6b',
            fontFamily: 'monospace'
        });
    }

    private createBackButton(): void {
        const backBtn = this.add.text(40, 25, '< MENU', {
            fontSize: '14px',
            color: '#666688',
            fontFamily: 'monospace'
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('MenuScene'))
            .on('pointerover', () => backBtn.setColor('#00ff88'))
            .on('pointerout', () => backBtn.setColor('#666688'));
    }

    private createCashDisplay(): void {
        const centerX = 400;
        const y = LAYOUT.TITLE_Y + 55;

        // Background panel for cash display
        this.cashDisplayBg = this.add.rectangle(centerX, y, 180, 45, 0x000000, 0.7);
        this.cashDisplayBg.setStrokeStyle(2, 0x00ff88);

        // "BANK" label
        this.add.text(centerX, y - 12, 'BANK', {
            fontSize: '10px',
            color: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Cash amount display
        this.cashDisplayText = this.add.text(centerX, y + 8, '$1,000', {
            fontSize: '24px',
            color: '#00ff88',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    private createBufferCostOverlays(): void {
        // Create cost text above each buffer
        for (let i = 0; i < SIMULATION_CONFIG.NUM_BUFFERS; i++) {
            const x = LAYOUT.BUFFER_X[i];
            const y = LAYOUT.MACHINES_Y - 70;

            const isSink = i === SIMULATION_CONFIG.NUM_BUFFERS - 1;

            const costText = this.add.text(x, y, '', {
                fontSize: '11px',
                color: isSink ? '#00ff88' : '#ff6b6b',
                fontFamily: 'monospace',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.bufferCostTexts.push(costText);
        }
    }

    private createGameOverOverlay(): void {
        // Full-screen semi-transparent overlay
        this.gameOverOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85);
        this.gameOverOverlay.setVisible(false);
        this.gameOverOverlay.setDepth(100);

        // Game over text
        this.gameOverText = this.add.text(640, 320, 'FACTORY CLOSED', {
            fontSize: '48px',
            color: '#ff6b6b',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.gameOverText.setVisible(false);
        this.gameOverText.setDepth(101);

        // Subtitle
        this.gameOverSubtext = this.add.text(640, 380, 'Cash depleted - Game Over', {
            fontSize: '18px',
            color: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.gameOverSubtext.setVisible(false);
        this.gameOverSubtext.setDepth(101);
    }

    private initializeSimulation(): void {
        // Set source buffer with starting inventory
        this.buffers[0].setItems(SIMULATION_CONFIG.STARTING_INVENTORY);

        // Reset all other buffers
        for (let i = 1; i < this.buffers.length; i++) {
            this.buffers[i].setItems(0);
        }

        this.elapsedTime = 0;
        this.itemEntryTimes = [];  // FIFO queue for lead time tracking
        this.completedLeadTimes = [];
        this.isRunning = false;
        this.isGameOver = false;
        this.metricsTracker.reset();

        // Initialize cash state
        this.currentCash = SIMULATION_CONFIG.STARTING_CAPITAL;
        this.totalRevenue = 0;
        this.totalMaterialCost = 0;
        this.totalOperatingCost = 0;

        this.updateMetricsDisplay();
        this.updateCashDisplay();
    }

    private toggleSimulation(): void {
        this.isRunning = !this.isRunning;

        if (this.isRunning) {
            this.startStopBtn.setFillStyle(0xff6b6b);
            this.startStopText.setText('STOP');
        } else {
            this.startStopBtn.setFillStyle(0x00ff88);
            this.startStopText.setText('START');
        }
    }

    private resetSimulation(): void {
        this.isRunning = false;
        this.isGameOver = false;

        // Re-enable and reset start button
        this.startStopBtn.setInteractive({ useHandCursor: true });
        this.startStopBtn.setFillStyle(0x00ff88);
        this.startStopText.setText('START');

        // Hide game over overlay
        this.gameOverOverlay.setVisible(false);
        this.gameOverText.setVisible(false);
        this.gameOverSubtext.setVisible(false);

        // Stop any pulse animation
        this.stopCashPulse();

        // Reset all machines
        for (const machine of this.machines) {
            machine.reset();
        }

        // Reset metrics tracker
        this.metricsTracker.reset();

        this.initializeSimulation();
    }

    update(_time: number, delta: number): void {
        if (this.isRunning && !this.isGameOver) {
            this.elapsedTime += delta;

            // Track items leaving source (entering the system)
            const sourceItemsBefore = this.buffers[0].items;

            // Track items completed at sink this frame
            let itemsCompletedAtSink = 0;

            // Update all machines and track their states
            for (let i = 0; i < this.machines.length; i++) {
                const machine = this.machines[i];
                const result = machine.update(delta);

                // Record station state for metrics
                this.metricsTracker.recordStationState(i, delta, result.state);

                // Track items completing at each machine
                if (result.itemCompleted) {
                    this.metricsTracker.recordItemProcessed(i);

                    // If this is the last machine, record lead time and track for revenue
                    if (i === this.machines.length - 1) {
                        itemsCompletedAtSink++;

                        if (this.itemEntryTimes.length > 0) {
                            const entryTime = this.itemEntryTimes.shift()!; // FIFO - oldest first
                            const leadTime = this.elapsedTime - entryTime;
                            this.completedLeadTimes.push(leadTime);
                        }
                    }
                }
            }

            // Track items that left the source buffer (entered the system)
            const sourceItemsAfter = this.buffers[0].items;
            const itemsEnteredSystem = sourceItemsBefore - sourceItemsAfter;

            // Add entry times to FIFO queue for items entering the system
            for (let i = 0; i < itemsEnteredSystem; i++) {
                this.itemEntryTimes.push(this.elapsedTime);
            }

            // === CASH CALCULATIONS ===

            // Raw material cost: $10 per item entering system
            const materialCostThisFrame = itemsEnteredSystem * SIMULATION_CONFIG.RAW_MATERIAL_COST;
            this.totalMaterialCost += materialCostThisFrame;

            // Operating expense: $2 per second
            const opExpenseThisFrame = (delta / 1000) * SIMULATION_CONFIG.OPERATING_EXPENSE_PER_SEC;
            this.totalOperatingCost += opExpenseThisFrame;

            // Revenue: $20 per item reaching sink
            const revenueThisFrame = itemsCompletedAtSink * SIMULATION_CONFIG.THROUGHPUT_VALUE;
            this.totalRevenue += revenueThisFrame;

            // Calculate current cash
            this.currentCash = SIMULATION_CONFIG.STARTING_CAPITAL
                + this.totalRevenue
                - this.totalMaterialCost
                - this.totalOperatingCost;

            // Check for game over
            if (this.currentCash <= 0) {
                this.triggerGameOver();
            }

            // Collect buffer lengths for metrics
            const bufferLengths = this.buffers.map(b => b.items);
            this.metricsTracker.update(delta, bufferLengths);

            this.updateMetricsDisplay();
            this.updateCashDisplay();
        }
    }

    private updateMetricsDisplay(): void {
        const metrics = this.metricsTracker.getMetrics();

        // Elapsed time
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        this.elapsedText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

        // 1. Throughput
        const shipped = this.buffers[this.buffers.length - 1].items;
        this.throughputText.setText(shipped.toString());

        const rate = this.elapsedTime > 0 ? (shipped / this.elapsedTime) * 60000 : 0;
        this.throughputRateText.setText(`${rate.toFixed(1)}/min`);

        // 2. WIP
        let wip = 0;
        for (let i = 1; i < this.buffers.length - 1; i++) {
            wip += this.buffers[i].items;
        }
        for (const machine of this.machines) {
            if (machine.isProcessing) wip++;
        }
        this.wipText.setText(wip.toString());

        // Color code WIP
        if (wip > 20) {
            this.wipText.setColor('#ff6b6b');
        } else if (wip > 10) {
            this.wipText.setColor('#ffd93d');
        } else {
            this.wipText.setColor('#00ff88');
        }

        // 3. Lead Time
        if (this.completedLeadTimes.length > 0) {
            const sorted = [...this.completedLeadTimes].sort((a, b) => a - b);
            const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
            const p50 = sorted[Math.floor(sorted.length * 0.5)];
            const p90 = sorted[Math.floor(sorted.length * 0.9)] || sorted[sorted.length - 1];

            this.leadTimeAvgText.setText(MetricsTracker.formatTime(avg));
            this.leadTimeP50Text.setText(MetricsTracker.formatTime(p50));
            this.leadTimeP90Text.setText(MetricsTracker.formatTime(p90));
        } else {
            this.leadTimeAvgText.setText('-');
            this.leadTimeP50Text.setText('-');
            this.leadTimeP90Text.setText('-');
        }

        // 4. Per-station metrics (utilization bar + throughput)
        const barWidth = 50;
        for (let i = 0; i < SIMULATION_CONFIG.NUM_STATIONS; i++) {
            const util = this.metricsTracker.getUtilization(i);
            const throughput = this.metricsTracker.getStationThroughput(i);

            // Update utilization bar width
            const fillWidth = (util / 100) * (barWidth - 2);
            this.stationUtilBars[i].width = Math.max(0, fillWidth);

            // Update utilization text
            this.stationUtilTexts[i].setText(`${util.toFixed(0)}%`);

            // Update throughput text
            this.stationThroughputTexts[i].setText(`${throughput.toFixed(1)}/min`);

            // Color code utilization bar based on value
            if (util > 80) {
                this.stationUtilBars[i].setFillStyle(0x00ff88);
            } else if (util > 50) {
                this.stationUtilBars[i].setFillStyle(0xffd93d);
            } else {
                this.stationUtilBars[i].setFillStyle(0xff6b6b);
            }
        }

        // 5. Buffer metrics (on buffers, skip source and sink)
        for (let i = 1; i < SIMULATION_CONFIG.NUM_BUFFERS - 1; i++) {
            const avgLen = this.metricsTracker.getAvgBufferLength(i);
            const maxLen = metrics.buffers[i].maxLength;

            // Update on-buffer metrics (Ø = average, ↑ = max)
            this.bufferOnAvgTexts[i - 1].setText(`Ø${avgLen.toFixed(1)}`);
            this.bufferOnMaxTexts[i - 1].setText(`↑${maxLen}`);

            // Color code based on queue length
            if (avgLen > 10) {
                this.bufferOnAvgTexts[i - 1].setColor('#ff6b6b');
            } else if (avgLen > 5) {
                this.bufferOnAvgTexts[i - 1].setColor('#ffd93d');
            } else {
                this.bufferOnAvgTexts[i - 1].setColor('#00ff88');
            }

            // Color code max based on value
            if (maxLen > 15) {
                this.bufferOnMaxTexts[i - 1].setColor('#ff6b6b');
            } else if (maxLen > 8) {
                this.bufferOnMaxTexts[i - 1].setColor('#ffd93d');
            } else {
                this.bufferOnMaxTexts[i - 1].setColor('#4ecdc4');
            }
        }
    }

    private updateCashDisplay(): void {
        // Format cash with $ sign
        const cashFormatted = `$${Math.floor(this.currentCash).toLocaleString()}`;
        this.cashDisplayText.setText(cashFormatted);

        // Color based on cash level
        if (this.currentCash < SIMULATION_CONFIG.CASH_WARNING_THRESHOLD) {
            // Critical - red with pulse
            this.cashDisplayText.setColor('#ff6b6b');
            this.cashDisplayBg.setStrokeStyle(2, 0xff6b6b);
            this.startCashPulse();
        } else if (this.currentCash < SIMULATION_CONFIG.STARTING_CAPITAL) {
            // Below starting - yellow
            this.cashDisplayText.setColor('#ffd93d');
            this.cashDisplayBg.setStrokeStyle(2, 0xffd93d);
            this.stopCashPulse();
        } else {
            // Healthy - green
            this.cashDisplayText.setColor('#00ff88');
            this.cashDisplayBg.setStrokeStyle(2, 0x00ff88);
            this.stopCashPulse();
        }

        // Update buffer cost overlays
        this.updateBufferCostOverlays();
    }

    private updateBufferCostOverlays(): void {
        for (let i = 0; i < this.buffers.length; i++) {
            const buffer = this.buffers[i];
            const costText = this.bufferCostTexts[i];

            const isSink = i === SIMULATION_CONFIG.NUM_BUFFERS - 1;

            if (isSink) {
                // SINK shows accumulated revenue
                const sinkValue = buffer.items * SIMULATION_CONFIG.THROUGHPUT_VALUE;
                if (sinkValue > 0) {
                    costText.setText(`+$${sinkValue}`);
                    costText.setColor('#00ff88');
                } else {
                    costText.setText('');
                }
            } else if (buffer.items > 0) {
                // Other buffers show locked cash
                const lockedCash = buffer.items * SIMULATION_CONFIG.RAW_MATERIAL_COST;
                costText.setText(`-$${lockedCash}`);
                costText.setColor('#ff6b6b');
            } else {
                costText.setText('');
            }
        }
    }

    private startCashPulse(): void {
        // Don't create duplicate tweens
        if (this.cashPulseTween && this.cashPulseTween.isPlaying()) {
            return;
        }

        this.cashPulseTween = this.tweens.add({
            targets: [this.cashDisplayText, this.cashDisplayBg],
            alpha: { from: 1, to: 0.4 },
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private stopCashPulse(): void {
        if (this.cashPulseTween) {
            this.cashPulseTween.stop();
            this.cashPulseTween = null;

            // Reset alpha
            this.cashDisplayText.setAlpha(1);
            this.cashDisplayBg.setAlpha(1);
        }
    }

    private triggerGameOver(): void {
        this.isGameOver = true;
        this.isRunning = false;

        // Stop the pulse animation
        this.stopCashPulse();

        // Set cash display to red
        this.cashDisplayText.setColor('#ff6b6b');
        this.cashDisplayText.setText('$0');
        this.cashDisplayBg.setStrokeStyle(2, 0xff6b6b);

        // Show game over overlay
        this.gameOverOverlay.setVisible(true);
        this.gameOverText.setVisible(true);
        this.gameOverSubtext.setVisible(true);

        // Update button state
        this.startStopBtn.setFillStyle(0x666666);
        this.startStopText.setText('GAME OVER');
        this.startStopBtn.disableInteractive();

        // Flash animation on the game over text
        this.tweens.add({
            targets: this.gameOverText,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.8, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });
    }
}
