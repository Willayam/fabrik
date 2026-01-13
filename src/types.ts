/**
 * Core type definitions for Fabrik
 */

// Item Types
export type ItemType = 'raw_metal' | 'stamped_piece' | 'bracket';

// Item Location - discrete slots, no physics
export type ItemLocation =
    | { type: 'carried'; by: 'player' }
    | { type: 'machine'; machineId: string; slot: 'input' | 'output'; index: number }
    | { type: 'floor'; zoneId: string; stackIndex: number };

// Item representing a physical object in the factory
export interface ItemData {
    id: string;
    itemType: ItemType;
    location: ItemLocation;
}

// Machine Configuration
export interface MachineConfig {
    id: string;
    name: string;
    processingTime: number;      // Base time in seconds
    variance: number;            // Gaussian σ (standard deviation)
    inputType: ItemType | null;
    outputType: ItemType | null;
    requiresOperator: boolean;
    inputSlots: number;
    outputSlots: number;
    batchSize: number;           // Items required to start processing
    salePrice?: number;          // Only for sale point
}

// Machine State - New "Start and Walk Away" model
export type MachineState =
    | 'idle'           // No input, nothing to do
    | 'ready_to_start' // Has input, waiting for player to press E
    | 'processing'     // Running independently (player can walk away)
    | 'output_ready'   // Processing done, output waiting for pickup
    | 'blocked';       // Output slot full, can't complete

// Game Economy State
export interface EconomyState {
    throughput: number;          // $ earned this shift
    inventoryCount: number;      // Items currently in system
    operatingExpense: number;    // $ cost per shift
}

// Pile Zone - discrete location where items can stack
export interface PileZone {
    id: string;
    x: number;
    y: number;
    capacity: number;
    items: ItemData[];
}

// Utility: Gaussian random number using Box-Muller transform
export function gaussianRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return Math.max(0, z0 * stdDev + mean); // Clamp to non-negative
}

// Utility: Generate unique IDs
let idCounter = 0;
export function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${idCounter++}`;
}
