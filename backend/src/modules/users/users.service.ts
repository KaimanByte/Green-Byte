import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { User, NewUser } from './users.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(private readonly userRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'hashPassword'>> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.hashPassword, this.saltRounds);
    const userWithHashedPassword = { ...createUserDto, hashPassword: hashedPassword };
    const user = await this.userRepository.create(userWithHashedPassword);
    const { hashPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(): Promise<Omit<User, 'hashPassword'>[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => {
      const { hashPassword: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async findById(id: number): Promise<Omit<User, 'hashPassword'> | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { hashPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<Omit<User, 'hashPassword'> | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { hashPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'hashPassword'> | null> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    let updateUser: Partial<NewUser> = { };
    if (updateUserDto.email) {
      const existingUserWithEmail = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUserWithEmail && existingUserWithEmail.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
      updateUser = { ...updateUser, email: updateUserDto.email };
    }
    if (updateUserDto.hashPassword) {
      const hashedPassword = await bcrypt.hash(updateUserDto.hashPassword, this.saltRounds);
      updateUser = { ...updateUser, hashPassword: hashedPassword };
    }
    const updatedUser = await this.userRepository.update(id, updateUser);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    const { hashPassword: _, ...user } = updatedUser;
    return user;
  }

  async remove(id: number): Promise<Omit<User, 'hashPassword'> | null> {
    const user = await this.userRepository.delete(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { hashPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
