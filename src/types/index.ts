import { ProductStock } from "./inventory";

export interface RawMaterialEntry {
    id: string;
    date: string; // ISO date string
    operatorName: string;
    materialName: string;
    quantityUsed: number; // in kg or units
    batchId?: string; // Optional linking ID
    timestamp: string;
}


export interface FinishedProductEntry {
    id: string;
    date: string; // ISO date string
    operatorName: string;
    productName: string;
    quantityProduced: number;
    batchId?: string;
    timestamp: string;
}

// A correlated record matching input to output
export interface ProductionRecord {
    id: string;
    date: string;
    batchId?: string;

    // Input
    rawMaterial: {
        name: string;
        quantity: number;
    };

    // Output
    finishedProduct: {
        name: string;
        quantity: number;
    };

    // Flat fields found in db.json (Legacy/Actual)
    componentProduced?: string;
    quantityProduced?: number;
    rmUsed?: string;
    rmQuantity?: number;

    // Analysis
    efficiency: number; // calculated yield ratio
    status: 'optimal' | 'warning' | 'critical';
    notes?: string;
}

export interface DailyReport {
    date: string;
    totalMaterialUsed: number;
    totalProduced: number;
    averageEfficiency: number;
    records: ProductionRecord[];
    alerts: string[];
    inventory: ProductStock[];
}
