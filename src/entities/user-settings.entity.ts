import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type ReminderFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

@Entity()
export class UserSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.settings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column({
    type: 'varchar',
    default: 'daily',
  })
  reminderFrequency: ReminderFrequency;

  @Column({
    type: 'varchar',
    default: '02:30',
  })
  reminderTime: string; // HH:MM format in UTC (default 02:30 = 09:00 AM Myanmar time)

  @Column({
    type: 'integer',
    default: 5,
  })
  reminderLimit: number; // 3-10 links per reminder

  @Column({
    type: 'boolean',
    default: false,
  })
  isSetupComplete: boolean;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  lastReminderSent?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
