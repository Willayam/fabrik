/**
 * Fabrik - Factory Simulation Game
 * Main entry point
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GarageScene } from './scenes/GarageScene';
import { UIScene } from './scenes/UIScene';
import { MatchstickScene } from './scenes/MatchstickScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    scene: [BootScene, MenuScene, GarageScene, UIScene, MatchstickScene],
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
