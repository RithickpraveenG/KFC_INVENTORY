import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { User } from '@/lib/types';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();
    const db = readDb();

    if (!db.users) return NextResponse.json({ error: 'No users found' }, { status: 404 });

    const index = db.users.findIndex((u: any) => u.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user
    db.users[index] = { ...db.users[index], ...body };
    writeDb(db);

    return NextResponse.json(db.users[index]);
}


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const db = readDb();

    if (!db.users) return NextResponse.json({ error: 'No users found' }, { status: 404 });

    const index = db.users.findIndex((u: any) => u.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting the last admin
    if (db.users[index].role === 'ADMIN') {
        const adminCount = db.users.filter((u: User) => u.role === 'ADMIN').length;
        if (adminCount <= 1) {
            return NextResponse.json({ error: 'Cannot delete the only Admin user.' }, { status: 400 });
        }
    }

    // Remove the user
    const deletedUser = db.users.splice(index, 1)[0];
    writeDb(db);

    return NextResponse.json(deletedUser);
}
