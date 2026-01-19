/**
 * Type definitions for the Matchstick Game simulation
 */

export interface MatchstickMachineConfig {
    stationIndex: number;           // 0-5
    ratePerMinute: number;          // items per minute (1-20)
    variancePercent: number;        // 0-100% of base processing time
}

export interface MatchstickSimulationState {
    isRunning: boolean;
    elapsedTime: number;            // seconds
    totalThroughput: number;        // items completed
}

// Simulation constants
export const SIMULATION_CONFIG = {
    STARTING_INVENTORY: 100,
    DEFAULT_RATE_PER_MINUTE: 6,
    DEFAULT_VARIANCE_PERCENT: 20,
    MIN_RATE: 1,
    MAX_RATE: 20,
    MIN_VARIANCE: 0,
    MAX_VARIANCE: 100,
    NUM_STATIONS: 6,
    NUM_BUFFERS: 7,  // Including source and sink

    // Cash is Oxygen constants
    STARTING_CAPITAL: 1000,         // $1,000 starting cash
    RAW_MATERIAL_COST: 10,          // $10 per item entering system
    OPERATING_EXPENSE_PER_SEC: 2,   // $2 per second
    THROUGHPUT_VALUE: 20,           // $20 per item reaching sink
    CASH_WARNING_THRESHOLD: 200,    // Pulse red below this
};

// Layout constants
export const LAYOUT = {
    // Y positions
    MACHINES_Y: 280,
    SLIDERS_RATE_Y: 480,
    SLIDERS_VARIANCE_Y: 540,
    STATS_Y: 50,
    TITLE_Y: 25,

    // X positions for stations (0-5)
    STATION_X: [145, 285, 425, 565, 705, 845] as const,

    // X positions for buffers (0-6)
    BUFFER_X: [60, 215, 355, 495, 635, 775, 930] as const,

    // Slider dimensions
    SLIDER_WIDTH: 80,
    SLIDER_HEIGHT: 8,

    // Machine dimensions
    MACHINE_WIDTH: 60,
    MACHINE_HEIGHT: 60,

    // Buffer dimensions
    BUFFER_WIDTH: 35,
    BUFFER_HEIGHT: 100,
};
