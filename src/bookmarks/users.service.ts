import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOrCreate(
    telegramId: number,
    username?: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { telegramId } });
    if (!user) {
      user = this.usersRepository.create({
        telegramId,
        username,
        firstName,
        lastName,
      });
      await this.usersRepository.save(user);
    } else {
      // Update username/firstName/lastName if they changed
      let updated = false;
      if (username !== undefined && user.username !== username) {
        user.username = username;
        updated = true;
      }
      if (firstName !== undefined && user.firstName !== firstName) {
        user.firstName = firstName;
        updated = true;
      }
      if (lastName !== undefined && user.lastName !== lastName) {
        user.lastName = lastName;
        updated = true;
      }
      if (updated) {
        await this.usersRepository.save(user);
      }
    }
    return user;
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramId } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }
}
