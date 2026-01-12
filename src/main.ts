/**
 * Fabrik - Factory Simulation Game
 * Main entry point
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GarageScene } from './scenes/GarageScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    scene: [BootScene, GarageScene, UIScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        pixelArt: true,
        antialias: false,
    },
};

const game = new Phaser.Game(config);

export default game;
