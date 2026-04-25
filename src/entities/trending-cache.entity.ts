import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Link } from './link.entity';

@Entity()
export class TrendingCache {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Link, { onDelete: 'CASCADE' })
  link: Link;

  @Column({ type: 'int', default: 0 })
  saveCount: number;

  @Column({ type: 'varchar', default: 'weekly' })
  period: string;

  @CreateDateColumn()
  calculatedAt: Date;
}
