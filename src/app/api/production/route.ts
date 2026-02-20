import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET() {
    const db = readDb();
    return NextResponse.json(db.productionLogs || []);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    console.log("Received production log request:", body);
    const db = readDb();

    // Ensure productionLogs exists
    if (!db.productionLogs) {
        db.productionLogs = [];
    }

    const newLog = {
        ...body,
        id: body.id || `LOG-${Date.now()}`,
        timestamp: new Date().toISOString()
    };

    db.productionLogs.push(newLog);
    writeDb(db);

    return NextResponse.json(newLog, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const db = readDb();
        if (!db.productionLogs) {
            return NextResponse.json({ error: 'No records found' }, { status: 404 });
        }

        const initialLength = db.productionLogs.length;
        db.productionLogs = db.productionLogs.filter((log: any) => log.id !== id);

        if (db.productionLogs.length === initialLength) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        writeDb(db);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
}
