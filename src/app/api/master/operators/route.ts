import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET() {
    const db = readDb();
    return NextResponse.json(db.operators);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const db = readDb();

    const newItem = {
        ...body,
        id: body.id || `OP-${Date.now()}`
    };

    db.operators.push(newItem);
    writeDb(db);

    return NextResponse.json(newItem, { status: 201 });
}
