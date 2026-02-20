import { ProductionRecord, DailyReport, RawMaterialEntry, FinishedProductEntry } from "@/types";
import { ProductStock } from "@/types/inventory";
import { correlateData } from "./data-engine";

export const generateDailyReport = (
    rawMaterials: RawMaterialEntry[],
    finishedProducts: FinishedProductEntry[],
    inventory: ProductStock[] = []
): DailyReport => {
    const records = correlateData(rawMaterials, finishedProducts);

    const totalMaterialUsed = records.reduce((sum, r) => sum + r.rawMaterial.quantity, 0);
    const totalProduced = records.reduce((sum, r) => sum + r.finishedProduct.quantity, 0);

    // Calculate Average Efficiency
    const averageEfficiency = records.length > 0
        ? records.reduce((sum, r) => sum + r.efficiency, 0) / records.length
        : 0;

    const alerts: string[] = [];
    const recommendations: string[] = [];

    // --- Statistical Anomaly Detection ---
    if (records.length > 1) {
        const variance = records.reduce((sum, r) => sum + Math.pow(r.efficiency - averageEfficiency, 2), 0) / records.length;
        const stdDev = Math.sqrt(variance);

        // Flag records more than 1.5 SD below mean
        records.forEach(r => {
            if (r.efficiency < (averageEfficiency - 1.5 * stdDev)) {
                r.status = 'critical';
                alerts.push(`Anomaly Detect: Batch ${r.batchId} efficiency is significantly low (${r.efficiency.toFixed(1)}%).`);
            }
        });
    }

    // --- Heuristic "AI" Analysis ---

    // 1. Efficiency Thresholds
    if (averageEfficiency < 80) {
        alerts.push("Warning: Overall production efficiency is below 80%.");
        recommendations.push("Investigate raw material quality for recent batches.");
    }

    // 2. Waste Detection (High Input, Low Efficiency)
    const highWasteBatches = records.filter(r => r.rawMaterial.quantity > 100 && r.efficiency < 75);
    if (highWasteBatches.length > 0) {
        recommendations.push(`Detected ${highWasteBatches.length} batches with high material usage but low yield. Check machine calibration.`);
    }

    // 3. Low Stock Alerts
    inventory.forEach(item => {
        if (item.currentStock < 50) { // Threshold could be configurable
            alerts.push(`Low Stock: ${item.name} (${item.currentStock} units).`);
        }
    });

    return {
        date: new Date().toISOString(),
        totalMaterialUsed,
        totalProduced,
        averageEfficiency,
        records,
        alerts: [...alerts, ...recommendations],
        inventory
    };
};
