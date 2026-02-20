import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    const body = await request.json();
    const db = readDb();

    const index = db.products.findIndex((p: any) => p.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update the item
    db.products[index] = { ...db.products[index], ...body };
    writeDb(db);

    return NextResponse.json(db.products[index]);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id;
    const db = readDb();

    const initialLength = db.products.length;
    db.products = db.products.filter((p: any) => p.id !== id);

    if (db.products.length === initialLength) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    writeDb(db);

    return NextResponse.json({ success: true });
}
