/**
 * Metrics tracking for the Matchstick Game simulation
 * These metrics help reveal Theory of Constraints principles
 */

export interface StationMetrics {
    stationIndex: number;
    busyTime: number;           // ms spent processing
    starvedTime: number;        // ms spent idle with no input
    blockedTime: number;        // ms spent waiting to output (buffer full)
    itemsProcessed: number;     // total items completed
}

export interface BufferMetrics {
    bufferIndex: number;
    samples: number[];          // queue length samples for avg calculation
    maxLength: number;          // max observed length
    currentLength: number;      // current length
}

export interface ItemTracker {
    id: number;
    entryTime: number;          // when item entered system (left source)
    exitTime?: number;          // when item exited system (reached sink)
}

export interface LeadTimeMetrics {
    completedItems: ItemTracker[];
    avgLeadTime: number;        // ms
    p50LeadTime: number;        // ms
    p90LeadTime: number;        // ms
}

export interface SimulationMetrics {
    // Time
    elapsedTime: number;        // ms

    // Throughput
    totalShipped: number;
    throughputPerMinute: number;

    // WIP
    totalWIP: number;

    // Lead Time
    leadTime: LeadTimeMetrics;

    // Per-station metrics
    stations: StationMetrics[];

    // Per-buffer metrics
    buffers: BufferMetrics[];
}

export class MetricsTracker {
    private metrics: SimulationMetrics;
    private itemIdCounter: number = 0;
    private activeItems: Map<number, ItemTracker> = new Map();
    private sampleInterval: number = 1000; // Sample every 1 second
    private lastSampleTime: number = 0;

    constructor(numStations: number, numBuffers: number) {
        this.metrics = {
            elapsedTime: 0,
            totalShipped: 0,
            throughputPerMinute: 0,
            totalWIP: 0,
            leadTime: {
                completedItems: [],
                avgLeadTime: 0,
                p50LeadTime: 0,
                p90LeadTime: 0,
            },
            stations: [],
            buffers: [],
        };

        // Initialize station metrics
        for (let i = 0; i < numStations; i++) {
            this.metrics.stations.push({
                stationIndex: i,
                busyTime: 0,
                starvedTime: 0,
                blockedTime: 0,
                itemsProcessed: 0,
            });
        }

        // Initialize buffer metrics
        for (let i = 0; i < numBuffers; i++) {
            this.metrics.buffers.push({
                bufferIndex: i,
                samples: [],
                maxLength: 0,
                currentLength: 0,
            });
        }
    }

    reset(): void {
        this.itemIdCounter = 0;
        this.activeItems.clear();
        this.lastSampleTime = 0;

        this.metrics.elapsedTime = 0;
        this.metrics.totalShipped = 0;
        this.metrics.throughputPerMinute = 0;
        this.metrics.totalWIP = 0;
        this.metrics.leadTime = {
            completedItems: [],
            avgLeadTime: 0,
            p50LeadTime: 0,
            p90LeadTime: 0,
        };

        for (const station of this.metrics.stations) {
            station.busyTime = 0;
            station.starvedTime = 0;
            station.blockedTime = 0;
            station.itemsProcessed = 0;
        }

        for (const buffer of this.metrics.buffers) {
            buffer.samples = [];
            buffer.maxLength = 0;
            buffer.currentLength = 0;
        }
    }

    // Called when an item leaves the source buffer
    itemEnteredSystem(): number {
        const id = this.itemIdCounter++;
        this.activeItems.set(id, {
            id,
            entryTime: this.metrics.elapsedTime,
        });
        return id;
    }

    // Called when an item reaches the sink
    itemExitedSystem(id: number): void {
        const item = this.activeItems.get(id);
        if (item) {
            item.exitTime = this.metrics.elapsedTime;
            this.metrics.leadTime.completedItems.push(item);
            this.activeItems.delete(id);
            this.metrics.totalShipped++;
            this.recalculateLeadTime();
        }
    }

    // Simple version without individual item tracking
    recordItemShipped(): void {
        this.metrics.totalShipped++;
    }

    // Record station state for a time delta
    recordStationState(
        stationIndex: number,
        delta: number,
        state: 'busy' | 'starved' | 'blocked'
    ): void {
        const station = this.metrics.stations[stationIndex];
        if (!station) return;

        switch (state) {
            case 'busy':
                station.busyTime += delta;
                break;
            case 'starved':
                station.starvedTime += delta;
                break;
            case 'blocked':
                station.blockedTime += delta;
                break;
        }
    }

    recordItemProcessed(stationIndex: number): void {
        const station = this.metrics.stations[stationIndex];
        if (station) {
            station.itemsProcessed++;
        }
    }

    // Update buffer metrics
    updateBufferLength(bufferIndex: number, length: number): void {
        const buffer = this.metrics.buffers[bufferIndex];
        if (!buffer) return;

        buffer.currentLength = length;
        buffer.maxLength = Math.max(buffer.maxLength, length);
    }

    // Called every frame
    update(delta: number, bufferLengths: number[]): void {
        this.metrics.elapsedTime += delta;

        // Sample buffer lengths periodically
        if (this.metrics.elapsedTime - this.lastSampleTime >= this.sampleInterval) {
            this.lastSampleTime = this.metrics.elapsedTime;

            for (let i = 0; i < bufferLengths.length; i++) {
                const buffer = this.metrics.buffers[i];
                if (buffer) {
                    buffer.samples.push(bufferLengths[i]);
                    buffer.currentLength = bufferLengths[i];
                    buffer.maxLength = Math.max(buffer.maxLength, bufferLengths[i]);
                }
            }
        }

        // Calculate throughput per minute
        if (this.metrics.elapsedTime > 0) {
            this.metrics.throughputPerMinute =
                (this.metrics.totalShipped / this.metrics.elapsedTime) * 60000;
        }

        // Calculate total WIP (exclude source and sink)
        this.metrics.totalWIP = 0;
        for (let i = 1; i < bufferLengths.length - 1; i++) {
            this.metrics.totalWIP += bufferLengths[i];
        }
    }

    private recalculateLeadTime(): void {
        const completed = this.metrics.leadTime.completedItems;
        if (completed.length === 0) return;

        // Calculate lead times
        const leadTimes = completed
            .filter(item => item.exitTime !== undefined)
            .map(item => item.exitTime! - item.entryTime)
            .sort((a, b) => a - b);

        if (leadTimes.length === 0) return;

        // Average
        const sum = leadTimes.reduce((a, b) => a + b, 0);
        this.metrics.leadTime.avgLeadTime = sum / leadTimes.length;

        // P50 (median)
        const p50Index = Math.floor(leadTimes.length * 0.5);
        this.metrics.leadTime.p50LeadTime = leadTimes[p50Index] || 0;

        // P90
        const p90Index = Math.floor(leadTimes.length * 0.9);
        this.metrics.leadTime.p90LeadTime = leadTimes[p90Index] || 0;
    }

    getMetrics(): SimulationMetrics {
        return this.metrics;
    }

    // Utility: get utilization as percentage
    getUtilization(stationIndex: number): number {
        const station = this.metrics.stations[stationIndex];
        if (!station || this.metrics.elapsedTime === 0) return 0;
        return (station.busyTime / this.metrics.elapsedTime) * 100;
    }

    // Utility: get starved percentage
    getStarvedPercent(stationIndex: number): number {
        const station = this.metrics.stations[stationIndex];
        if (!station || this.metrics.elapsedTime === 0) return 0;
        return (station.starvedTime / this.metrics.elapsedTime) * 100;
    }

    // Utility: get blocked percentage
    getBlockedPercent(stationIndex: number): number {
        const station = this.metrics.stations[stationIndex];
        if (!station || this.metrics.elapsedTime === 0) return 0;
        return (station.blockedTime / this.metrics.elapsedTime) * 100;
    }

    // Utility: get average buffer length
    getAvgBufferLength(bufferIndex: number): number {
        const buffer = this.metrics.buffers[bufferIndex];
        if (!buffer || buffer.samples.length === 0) return 0;
        const sum = buffer.samples.reduce((a, b) => a + b, 0);
        return sum / buffer.samples.length;
    }

    // Utility: get max buffer length
    getMaxBufferLength(bufferIndex: number): number {
        const buffer = this.metrics.buffers[bufferIndex];
        if (!buffer) return 0;
        return buffer.maxLength;
    }

    // Utility: get station throughput (items per minute)
    getStationThroughput(stationIndex: number): number {
        const station = this.metrics.stations[stationIndex];
        if (!station || this.metrics.elapsedTime === 0) return 0;
        return (station.itemsProcessed / this.metrics.elapsedTime) * 60000;
    }

    // Utility: get items processed by station
    getItemsProcessed(stationIndex: number): number {
        const station = this.metrics.stations[stationIndex];
        if (!station) return 0;
        return station.itemsProcessed;
    }

    // Format time in seconds
    static formatTime(ms: number): string {
        const seconds = ms / 1000;
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
