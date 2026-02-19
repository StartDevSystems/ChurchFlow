import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const postgres = new PrismaClient();

async function readSqlite(query: string): Promise<any[]> {
    const db = new sqlite3.Database('./prisma/dev.db');
    const all = promisify(db.all).bind(db);
    try {
        const rows = await all(query);
        return rows as any[];
    } finally {
        db.close();
    }
}

async function migrate() {
    console.log('🚀 Iniciando la mudanza de datos (Plan C: Lectura Directa corregido)...');

    try {
        // 1. Leer datos de SQLite
        console.log('--- Paso 1: Leyendo SQLite ---');
        const categories = await readSqlite('SELECT * FROM "Category"');
        const members = await readSqlite('SELECT * FROM "Member"');
        const events = await readSqlite('SELECT * FROM "Event"');
        const transactions = await readSqlite('SELECT * FROM "Transaction"');
        const transfers = await readSqlite('SELECT * FROM "Transfer"');
        const users = await readSqlite('SELECT * FROM "User"');

        console.log(`✅ Datos leídos con éxito.`);

        // 2. Escribir en Postgres (Supabase)
        console.log('--- Paso 2: Enviando a Supabase ---');

        const fixDates = (items: any[]) => items.map(item => {
            const newItem = { ...item };
            if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt);
            if (newItem.date) newItem.date = new Date(newItem.date);
            if (newItem.startDate) newItem.startDate = new Date(newItem.startDate);
            if (newItem.endDate) newItem.endDate = newItem.endDate ? new Date(newItem.endDate) : null;
            return newItem;
        });

        if (categories.length > 0) {
            console.log(`Migrando ${categories.length} categorías...`);
            await postgres.category.createMany({ data: fixDates(categories), skipDuplicates: true });
        }

        if (members.length > 0) {
            console.log(`Migrando ${members.length} miembros...`);
            await postgres.member.createMany({ data: fixDates(members), skipDuplicates: true });
        }

        if (events.length > 0) {
            console.log(`Migrando ${events.length} eventos...`);
            await postgres.event.createMany({ data: fixDates(events), skipDuplicates: true });
        }

        if (users.length > 0) {
            console.log(`Migrando ${users.length} usuarios...`);
            await postgres.user.createMany({ data: fixDates(users), skipDuplicates: true });
        }

        if (transactions.length > 0) {
            console.log(`Migrando ${transactions.length} transacciones...`);
            await postgres.transaction.createMany({ data: fixDates(transactions), skipDuplicates: true });
        }

        if (transfers.length > 0) {
            console.log(`Migrando ${transfers.length} transferencias...`);
            await postgres.transfer.createMany({ data: fixDates(transfers), skipDuplicates: true });
        }

        console.log('✨ ¡Mudanza completada con éxito! Todos tus datos están ahora en Supabase.');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await postgres.$disconnect();
    }
}

migrate();
