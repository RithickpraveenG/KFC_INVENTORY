import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Operator } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: any) {
    const { id } = await params;
    const body = await request.json();
    const db = readDb();

    const index = db.operators.findIndex((o: Operator) => o.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    // Update the item
    db.operators[index] = { ...db.operators[index], ...body };
    writeDb(db);

    return NextResponse.json(db.operators[index]);
}

export async function DELETE(request: NextRequest, { params }: any) {
    const { id } = await params;
    const db = readDb();

    const initialLength = db.operators.length;
    db.operators = db.operators.filter((o: Operator) => o.id !== id);

    if (db.operators.length === initialLength) {
        return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    writeDb(db);

    return NextResponse.json({ success: true });
}
