import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET() {
    const db = readDb();
    return NextResponse.json(db.materials);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const db = readDb();

    // Simple validation could go here
    const newItem = {
        ...body,
        id: body.id || `RM-${Date.now()}` // Fallback ID generation if not provided
    };

    db.materials.push(newItem);
    writeDb(db);

    return NextResponse.json(newItem, { status: 201 });
}
