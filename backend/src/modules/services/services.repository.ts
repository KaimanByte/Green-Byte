import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { services, Service, NewService } from './services.schema';

@Injectable()
export class ServicesRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(): Promise<Service[]> {
    return this.dbService.db.select().from(services);
  }

  async findById(id: string): Promise<Service | null> {
    const result = await this.dbService.db
      .select()
      .from(services)
      .where(eq(services.id, id));
    
    return result[0] || null;
  }

  async create(data: NewService): Promise<Service> {
    const result = await this.dbService.db
      .insert(services)
      .values(data)
      .returning();
      
    return result[0];
  }

  async updateStatus(id: string, status: string): Promise<Service | null> {
    const result = await this.dbService.db
      .update(services)
      .set({ status })
      .where(eq(services.id, id))
      .returning();
      
    return result[0] || null;
  }

  async delete(id: string): Promise<Service | null> {
    const result = await this.dbService.db
      .delete(services)
      .where(eq(services.id, id))
      .returning();
      
    return result[0] || null;
  }
}