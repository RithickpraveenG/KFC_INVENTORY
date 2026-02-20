import { InventoryManager } from "@/components/inventory-manager";

async function getInventoryData() {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${BASE_URL}/api/inventory?format=full`, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error('Failed to fetch inventory data');
        }
        return res.json();
    } catch (error) {
        console.error("Error fetching inventory:", error);
        return { stock: [], history: [] };
    }
}

export default async function InventoryPage() {
    const { stock, history } = await getInventoryData();

    return (
        <main className="container py-8 max-w-7xl mx-auto min-h-screen">
            <InventoryManager initialStock={stock} initialHistory={history} />
        </main>
    );
}
