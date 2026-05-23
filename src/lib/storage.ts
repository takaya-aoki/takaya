import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface BusinessCard {
  id: string;
  imageData: string; // base64 image
  companyName: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  rawText: string;
  createdAt: number;
  source: 'scan' | 'import';
}

interface CardDB extends DBSchema {
  cards: {
    key: string;
    value: BusinessCard;
    indexes: { 'by-date': number };
  };
}

let db: IDBPDatabase<CardDB>;

export async function getDB() {
  if (!db) {
    db = await openDB<CardDB>('business-cards', 1, {
      upgrade(db) {
        const store = db.createObjectStore('cards', { keyPath: 'id' });
        store.createIndex('by-date', 'createdAt');
      },
    });
  }
  return db;
}

export async function saveCard(card: BusinessCard): Promise<void> {
  const database = await getDB();
  await database.put('cards', card);
}

export async function getAllCards(): Promise<BusinessCard[]> {
  const database = await getDB();
  const cards = await database.getAllFromIndex('cards', 'by-date');
  return cards.reverse();
}

export async function deleteCard(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('cards', id);
}

export async function getCard(id: string): Promise<BusinessCard | undefined> {
  const database = await getDB();
  return database.get('cards', id);
}
