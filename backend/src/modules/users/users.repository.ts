import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { users, User, NewUser } from './users.schema';

@Injectable()
export class UsersRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(): Promise<User[]> {
    return this.dbService.db.select().from(users);
  }

  async findById(id: number): Promise<User| null> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User| null> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    return result[0] || null;
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.dbService.db
      .insert(users)
      .values(data)
      .returning();
      
    return result[0];
  }

  async update(id: number, data: Partial<NewUser>): Promise<User | null> {
    const result = await this.dbService.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
      
    return result[0] || null;
  }

  async delete(id: number): Promise<User | null> {
    const result = await this.dbService.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
      
    return result[0] || null;
  }
}