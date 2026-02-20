import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = readDb();
        const logs = db.productionLogs || [];
        const currentYear = new Date().getFullYear();
        const prefix = `B-${currentYear}-`;

        // Filter logs for current year and exclude non-conforming IDs
        const yearLogs = logs.filter((log: any) => log.batchId && log.batchId.startsWith(prefix));

        let maxId = 0;
        yearLogs.forEach((log: any) => {
            const parts = log.batchId.split('-');
            if (parts.length === 3) {
                const num = parseInt(parts[2], 10);
                if (!isNaN(num) && num > maxId) {
                    maxId = num;
                }
            }
        });

        // Increment ID
        const nextNum = maxId + 1;
        const nextId = `${prefix}${String(nextNum).padStart(4, '0')}`;

        return NextResponse.json({ id: nextId });
    } catch (error) {
        console.error("Failed to generate batch ID:", error);
        // Fallback to timestamp if error
        return NextResponse.json({ id: `B-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}` });
    }
}
