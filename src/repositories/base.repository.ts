import { db } from '../db';
import type { DbClient } from '../db';
import { eq } from 'drizzle-orm';
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';

export abstract class BaseRepository<T extends SQLiteTableWithColumns<any>> {
  protected db: DbClient;
  protected table: T;

  constructor(table: T) {
    this.db = db;
    this.table = table;
  }

  async findAll() {
    try {
      return await this.db.select().from(this.table).all();
    } catch (error) {
      console.error(`[DB Error] Failed to fetch all from ${this.table._.name.name}:`, error);
      throw new Error(`Database error: Could not retrieve data. There might be a schema mismatch.`);
    }
  }

  async findById(id: string | number) {
    try {
      // @ts-ignore - Assuming all table have an 'id' column
      return await this.db.select().from(this.table).where(eq(this.table.id, id)).get();
    } catch (error) {
      console.error(`[DB Error] Failed to find ${this.table._.name.name} by ID ${id}:`, error);
      throw error;
    }
  }

  async create(data: any) {
    try {
      return await this.db.insert(this.table).values(data).returning().get();
    } catch (error) {
      console.error(`[DB Error] Failed to create ${this.table._.name.name}:`, error);
      throw error;
    }
  }

  async update(id: string | number, data: any) {
    try {
      // @ts-ignore
      return await this.db.update(this.table).set(data).where(eq(this.table.id, id)).returning().get();
    } catch (error) {
      console.error(`[DB Error] Failed to update ${this.table._.name.name} ID ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string | number) {
    try {
      // @ts-ignore
      return await this.db.delete(this.table).where(eq(this.table.id, id)).returning().get();
    } catch (error) {
      console.error(`[DB Error] Failed to delete ${this.table._.name.name} ID ${id}:`, error);
      throw error;
    }
  }
}
