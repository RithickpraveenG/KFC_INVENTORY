import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    const body = await request.json();
    const db = readDb();

    const index = db.operators.findIndex((op: any) => op.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    // Update the item
    db.operators[index] = { ...db.operators[index], ...body };
    writeDb(db);

    return NextResponse.json(db.operators[index]);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    const db = readDb();

    const initialLength = db.operators.length;
    db.operators = db.operators.filter((op: any) => op.id !== id);

    if (db.operators.length === initialLength) {
        return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    writeDb(db);

    return NextResponse.json({ success: true });
}
