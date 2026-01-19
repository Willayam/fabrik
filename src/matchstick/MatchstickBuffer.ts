import Phaser from 'phaser';
import { LAYOUT } from './MatchstickTypes';

export class MatchstickBuffer extends Phaser.GameObjects.Container {
    public bufferIndex: number;
    public items: number = 0;

    private bg: Phaser.GameObjects.Rectangle;
    private itemDots: Phaser.GameObjects.Rectangle[] = [];
    private countText: Phaser.GameObjects.Text;
    private labelText: Phaser.GameObjects.Text;

    private isSource: boolean;
    private isSink: boolean;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        bufferIndex: number,
        isSource: boolean = false,
        isSink: boolean = false
    ) {
        super(scene, x, y);
        this.bufferIndex = bufferIndex;
        this.isSource = isSource;
        this.isSink = isSink;

        // Buffer background
        const height = LAYOUT.BUFFER_HEIGHT;
        const borderColor = isSource ? 0x00ff88 : (isSink ? 0xffd93d : 0x4a4a5a);
        this.bg = scene.add.rectangle(0, 0, LAYOUT.BUFFER_WIDTH, height, 0x2a2a3a);
        this.bg.setStrokeStyle(2, borderColor);
        this.add(this.bg);

        // Label
        const labelStr = isSource ? 'SOURCE' : (isSink ? 'SINK' : '');
        this.labelText = scene.add.text(0, -height / 2 - 12, labelStr, {
            fontSize: '9px',
            color: isSource ? '#00ff88' : '#ffd93d',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.add(this.labelText);

        // Item count display
        this.countText = scene.add.text(0, height / 2 + 14, '0', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(this.countText);

        // Create pool of item dots for visualization (5 columns x 8 rows = 40 max visible)
        const dotSize = 5;
        const dotSpacing = 6;
        const cols = 5;
        const rows = 12;
        const startY = height / 2 - 10;

        for (let i = 0; i < cols * rows; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const dotX = (col - (cols - 1) / 2) * dotSpacing;
            const dotY = startY - row * dotSpacing;

            const dot = scene.add.rectangle(dotX, dotY, dotSize, dotSize, 0x888888);
            dot.setVisible(false);
            this.add(dot);
            this.itemDots.push(dot);
        }

        scene.add.existing(this);
    }

    setItems(count: number): void {
        this.items = count;
        this.updateVisual();
    }

    updateVisual(): void {
        this.countText.setText(this.items.toString());

        // Show/hide item dots
        const maxVisible = this.itemDots.length;
        for (let i = 0; i < maxVisible; i++) {
            const shouldShow = i < this.items;
            this.itemDots[i].setVisible(shouldShow);

            // Color based on buffer type
            if (shouldShow) {
                if (this.isSource) {
                    this.itemDots[i].setFillStyle(0x00ff88);
                } else if (this.isSink) {
                    this.itemDots[i].setFillStyle(0xffd93d);
                } else {
                    // Gradient from cyan to red based on stack height
                    this.itemDots[i].setFillStyle(0x4ecdc4);
                }
            }
        }

        // Color code count based on inventory level
        if (this.isSource) {
            // Source: red when low
            if (this.items === 0) {
                this.countText.setColor('#ff6b6b');
            } else if (this.items < 10) {
                this.countText.setColor('#ffd93d');
            } else {
                this.countText.setColor('#00ff88');
            }
        } else if (this.isSink) {
            // Sink: green is good
            this.countText.setColor('#ffd93d');
        } else {
            // Middle buffers: red if empty, yellow if high
            if (this.items === 0) {
                this.countText.setColor('#ff6b6b');
            } else if (this.items > 15) {
                this.countText.setColor('#ffd93d');
            } else {
                this.countText.setColor('#ffffff');
            }
        }
    }
}
