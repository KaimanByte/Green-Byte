import { Injectable } from '@nestjs/common';
import { and, asc, count, eq } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { ADMIN_ROLE } from './user-role';
import { users, User, NewUser } from './users.schema';

@Injectable()
export class UsersRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(): Promise<User[]> {
    return this.dbService.db.select().from(users).orderBy(asc(users.id));
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.dbService.db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.dbService.db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  }

  /** Quantidade de administradores com conta ativa (usada para nunca ficar sem admin). */
  async countActiveAdmins(): Promise<number> {
    const result = await this.dbService.db
      .select({ total: count() })
      .from(users)
      .where(and(eq(users.role, ADMIN_ROLE), eq(users.isActive, true)));
    return Number(result[0]?.total ?? 0);
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.dbService.db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewUser>): Promise<User | null> {
    const result = await this.dbService.db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: number): Promise<User | null> {
    const result = await this.dbService.db.delete(users).where(eq(users.id, id)).returning();
    return result[0] || null;
  }
}
