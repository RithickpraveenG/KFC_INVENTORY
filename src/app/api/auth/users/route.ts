import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET() {
    const db = readDb();
    return NextResponse.json(db.users || []);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const db = readDb();

    if (!db.users) db.users = [];

    const newItem = {
        ...body,
        id: body.id || `u-${Date.now()}`
    };

    db.users.push(newItem);
    writeDb(db);

    return NextResponse.json(newItem, { status: 201 });
}
