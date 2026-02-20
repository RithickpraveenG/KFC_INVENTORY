import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    const body = await request.json();
    const db = readDb();

    const index = db.materials.findIndex((m: any) => m.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Update the item
    db.materials[index] = { ...db.materials[index], ...body };
    writeDb(db);

    return NextResponse.json(db.materials[index]);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    const db = readDb();

    const initialLength = db.materials.length;
    db.materials = db.materials.filter((m: any) => m.id !== id);

    if (db.materials.length === initialLength) {
        return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    writeDb(db);

    return NextResponse.json({ success: true });
}
