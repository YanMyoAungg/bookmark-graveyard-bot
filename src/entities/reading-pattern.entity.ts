import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class ReadingPattern {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.readingPattern, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'int', nullable: true })
  preferredUtcHour: number | null;

  @Column({ type: 'int', nullable: true })
  bestDayOfWeek: number | null;

  @Column({ type: 'timestamp', nullable: true })
  lastDerivedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
