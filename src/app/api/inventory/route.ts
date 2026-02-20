import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DispatchRecord, ProductStock } from '@/types/inventory';
import { ProductionRecord } from '@/types';

const dataFilePath = path.join(process.cwd(), 'data', 'db.json');

function getData() {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(fileContents);
}

function saveData(data: any) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// GET: Calculate and return stock for all products
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format');

        const data = getData();
        const productionLogs: ProductionRecord[] = data.productionLogs || [];
        const dispatchLogs: DispatchRecord[] = data.dispatchLogs || [];
        const products: any[] = data.products || []; // Read products to get minStock

        // 1. Calculate Total Produced
        const producedMap: Record<string, number> = {};
        productionLogs.forEach(log => {
            // Handle potentially different log attributes (legacy vs new)
            // The db.json shows 'componentProduced' and 'quantityProduced'
            const prodName = log.componentProduced || (log.finishedProduct && log.finishedProduct.name) || 'Unknown';
            const quantity = log.quantityProduced || (log.finishedProduct && log.finishedProduct.quantity) || 0;

            if (prodName !== 'Unknown') {
                producedMap[prodName] = (producedMap[prodName] || 0) + quantity;
            }
        });

        // 2. Calculate Total Dispatched
        const dispatchedMap: Record<string, number> = {};
        dispatchLogs.forEach(log => {
            const prodName = log.productName;
            dispatchedMap[prodName] = (dispatchedMap[prodName] || 0) + log.quantity;
        });

        // 3. Combine into Stock Report
        // Iterate over ALL defined products from Master Data
        const stockReport: ProductStock[] = products.map((product: any) => {
            const name = product.name;
            const totalProduced = producedMap[name] || 0;
            const totalDispatched = dispatchedMap[name] || 0;
            const minStockLevel = product.minStockLevel || 50;

            return {
                name,
                totalProduced,
                totalDispatched,
                currentStock: totalProduced - totalDispatched,
                minStockLevel,
                type: product.type || 'FINISHED'
            };
        });

        // Also include items found in logs but NOT in products (legacy checks)
        Object.keys(producedMap).forEach(name => {
            if (!products.find((p: any) => p.name === name)) {
                const totalProduced = producedMap[name] || 0;
                const totalDispatched = dispatchedMap[name] || 0;
                stockReport.push({
                    name,
                    totalProduced,
                    totalDispatched,
                    currentStock: totalProduced - totalDispatched,
                    minStockLevel: 50, // Default since not in Master Data
                    type: 'FINISHED'
                });
            }
        });

        if (format === 'full') {
            return NextResponse.json({
                stock: stockReport,
                history: dispatchLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            });
        }

        return NextResponse.json(stockReport);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

// POST: Create a new Dispatch Record
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { date, productName, quantity, destination, destinationDetail, notes } = body;

        const data = getData();

        // --- VALIDATION: Check for sufficient stock ---
        const productionLogs: ProductionRecord[] = data.productionLogs || [];
        const dispatchLogs: DispatchRecord[] = data.dispatchLogs || [];

        const totalProduced = productionLogs
            .filter(p => {
                const pName = p.componentProduced || (p.finishedProduct && p.finishedProduct.name);
                return pName === productName;
            })
            .reduce((sum, p) => {
                const qty = p.quantityProduced || (p.finishedProduct && p.finishedProduct.quantity) || 0;
                return sum + qty;
            }, 0);

        const totalDispatched = dispatchLogs
            .filter(d => d.productName === productName)
            .reduce((sum, d) => sum + d.quantity, 0);

        const currentStock = totalProduced - totalDispatched;

        if (quantity > currentStock) {
            return NextResponse.json(
                { error: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}` },
                { status: 400 }
            );
        }

        // --- CREATE RECORD ---
        const newDispatch: DispatchRecord = {
            id: `DIS-${Date.now()}`,
            date,
            productName,
            quantity: Number(quantity),
            destination,
            destinationDetail: destinationDetail || '',
            notes: notes || '',
            timestamp: new Date().toISOString()
        };

        if (!data.dispatchLogs) {
            data.dispatchLogs = [];
        }
        data.dispatchLogs.push(newDispatch);
        saveData(data);

        return NextResponse.json(newDispatch);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create dispatch record' }, { status: 500 });
    }
}

// DELETE: Remove a Dispatch Record
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const data = getData();
        if (!data.dispatchLogs) {
            return NextResponse.json({ error: 'No records found' }, { status: 404 });
        }

        const initialLength = data.dispatchLogs.length;
        data.dispatchLogs = data.dispatchLogs.filter((log: any) => log.id !== id);

        if (data.dispatchLogs.length === initialLength) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        saveData(data);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
}
