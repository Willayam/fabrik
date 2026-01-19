import Phaser from 'phaser';

export interface SliderConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    minValue: number;
    maxValue: number;
    initialValue: number;
    // Custom formatter: returns [valueText, suffixText]
    // e.g., ["6.0", "/min"] or ["+-35", "%"]
    formatLabel?: (value: number) => [string, string];
    onChange: (value: number) => void;
}

export class Slider extends Phaser.GameObjects.Container {
    private track: Phaser.GameObjects.Rectangle;
    private fill: Phaser.GameObjects.Rectangle;
    private handle: Phaser.GameObjects.Rectangle;
    private labelValueText: Phaser.GameObjects.Text;
    private labelSuffixText: Phaser.GameObjects.Text;

    private config: SliderConfig;
    private currentValue: number;

    constructor(scene: Phaser.Scene, config: SliderConfig) {
        super(scene, config.x, config.y);
        this.config = config;
        this.currentValue = config.initialValue;

        // Track background
        this.track = scene.add.rectangle(0, 0, config.width, config.height, 0x333333);
        this.track.setStrokeStyle(1, 0x555555);
        this.add(this.track);

        // Fill bar (shows current value)
        const fillWidth = this.valueToPosition(config.initialValue);
        this.fill = scene.add.rectangle(
            -config.width / 2 + fillWidth / 2,
            0,
            fillWidth,
            config.height - 2,
            0x00ff88
        );
        this.add(this.fill);

        // Draggable handle
        const handleX = this.valueToPosition(config.initialValue) - config.width / 2;
        this.handle = scene.add.rectangle(handleX, 0, 12, config.height + 8, 0xffffff);
        this.handle.setStrokeStyle(2, 0x00ff88);
        this.handle.setInteractive({ useHandCursor: true, draggable: true });
        this.add(this.handle);

        // Label above - split into value (white) and suffix (gray)
        const [initialValue, initialSuffix] = this.formatLabel(config.initialValue);

        this.labelValueText = scene.add.text(0, -16, initialValue, {
            fontSize: '11px',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(1, 0.5);
        this.add(this.labelValueText);

        this.labelSuffixText = scene.add.text(0, -16, initialSuffix, {
            fontSize: '11px',
            color: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0, 0.5);
        this.add(this.labelSuffixText);

        // Setup drag events
        this.setupDragEvents(scene);

        scene.add.existing(this);
    }

    private setupDragEvents(scene: Phaser.Scene): void {
        scene.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
            if (gameObject !== this.handle) return;

            // Clamp handle position to track bounds
            const minX = -this.config.width / 2;
            const maxX = this.config.width / 2;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

            this.handle.x = clampedX;

            // Update fill bar
            const fillWidth = clampedX - minX;
            this.fill.width = fillWidth;
            this.fill.x = minX + fillWidth / 2;

            // Calculate and update value
            const normalizedPosition = (clampedX - minX) / this.config.width;
            this.currentValue = this.config.minValue + normalizedPosition * (this.config.maxValue - this.config.minValue);

            this.updateLabel();
            this.config.onChange(this.currentValue);
        });
    }

    private valueToPosition(value: number): number {
        const normalized = (value - this.config.minValue) / (this.config.maxValue - this.config.minValue);
        return normalized * this.config.width;
    }

    private formatLabel(value: number): [string, string] {
        if (this.config.formatLabel) {
            return this.config.formatLabel(value);
        }
        // Default format
        return [value.toFixed(1), ''];
    }

    private updateLabel(): void {
        const [valueStr, suffixStr] = this.formatLabel(this.currentValue);
        this.labelValueText.setText(valueStr);
        this.labelSuffixText.setText(suffixStr);
    }

    getValue(): number {
        return this.currentValue;
    }

    setValue(value: number): void {
        this.currentValue = Phaser.Math.Clamp(value, this.config.minValue, this.config.maxValue);

        const handleX = this.valueToPosition(this.currentValue) - this.config.width / 2;
        this.handle.x = handleX;

        const fillWidth = this.valueToPosition(this.currentValue);
        this.fill.width = fillWidth;
        this.fill.x = -this.config.width / 2 + fillWidth / 2;

        this.updateLabel();
    }
}
