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
    return await this.db.select().from(this.table).all();
  }

  async findById(id: string | number) {
    // @ts-ignore - Assuming all table have an 'id' column
    return await this.db.select().from(this.table).where(eq(this.table.id, id)).get();
  }

  async create(data: any) {
    return await this.db.insert(this.table).values(data).returning().get();
  }

  async update(id: string | number, data: any) {
    // @ts-ignore
    return await this.db.update(this.table).set(data).where(eq(this.table.id, id)).returning().get();
  }

  async delete(id: string | number) {
    // @ts-ignore
    return await this.db.delete(this.table).where(eq(this.table.id, id)).returning().get();
  }
}
