import { RawMaterialEntry, FinishedProductEntry, ProductionRecord } from "@/types";
import { ProductStock } from "@/types/inventory";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const fetchData = async (): Promise<{ rawMaterials: RawMaterialEntry[], finishedProducts: FinishedProductEntry[], inventory: ProductStock[] }> => {
    try {
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Fetch from our internal API (requiring absolute URL on server)
        const [matRes, prodRes, logsRes, invRes] = await Promise.all([
            fetch(`${BASE_URL}/api/master/materials`),
            fetch(`${BASE_URL}/api/master/products`),
            fetch(`${BASE_URL}/api/production`),
            fetch(`${BASE_URL}/api/inventory`)
        ]);

        if (!matRes.ok || !prodRes.ok) {
            console.warn("Failed to fetch some data");
            return { rawMaterials: [], finishedProducts: [], inventory: [] };
        }

        const materials = await matRes.json();
        const products = await prodRes.json();
        const logs = await logsRes.ok ? await logsRes.json() : [];
        const inventory = await invRes.ok ? await invRes.json() : [];

        // MAPPING LOGIC (Adapting DB logs to UI types)
        const rawMaterials: RawMaterialEntry[] = logs.map((log: any) => ({
            id: `RM-${log.id || log.batchId}`, // Fallback ID
            // Handle both old and new schema
            materialName: log.rmUsed || log.materialName,
            quantityUsed: log.rmQuantity || log.quantity,
            batchId: log.batchId,
            date: log.date,
            operatorName: log.operator,
            timestamp: log.timestamp || new Date().toISOString()
        }));

        const finishedProducts: FinishedProductEntry[] = logs.map((log: any) => ({
            id: `FP-${log.id || log.batchId}`,
            // Handle both old and new schema
            productName: log.componentProduced || log.productName || 'Pending',
            quantityProduced: log.quantityProduced || log.unitsProduced || 0,
            batchId: log.batchId,
            date: log.date,
            operatorName: log.operator,
            timestamp: log.timestamp || new Date().toISOString()
        }));

        return { rawMaterials, finishedProducts, inventory };

    } catch (error) {
        console.error("Error fetching data:", error);
        return { rawMaterials: [], finishedProducts: [], inventory: [] };
    }
};

export const correlateData = (rawMaterials: RawMaterialEntry[], finishedProducts: FinishedProductEntry[]): ProductionRecord[] => {
    const records: ProductionRecord[] = [];

    // Match by Batch ID primarily
    rawMaterials.forEach(rm => {
        const match = finishedProducts.find(fp => fp.batchId === rm.batchId);

        if (match) {
            const efficiency = (match.quantityProduced / rm.quantityUsed) * 100;
            let status: 'optimal' | 'warning' | 'critical' = 'optimal';

            // Simple heuristic for status
            if (efficiency < 75) status = 'critical';
            else if (efficiency < 85) status = 'warning';

            records.push({
                id: `${rm.id}-${match.id}`,
                date: rm.date,
                batchId: rm.batchId,
                rawMaterial: { name: rm.materialName, quantity: rm.quantityUsed },
                finishedProduct: { name: match.productName, quantity: match.quantityProduced },
                efficiency,
                status
            });
        }
    });

    return records;
};
