import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Product } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();
    const db = readDb();

    const index = db.products.findIndex((p: Product) => p.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update the item
    db.products[index] = { ...db.products[index], ...body };
    writeDb(db);

    return NextResponse.json(db.products[index]);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const db = readDb();

    const initialLength = db.products.length;
    db.products = db.products.filter((p: Product) => p.id !== id);

    if (db.products.length === initialLength) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    writeDb(db);

    return NextResponse.json({ success: true });
}
