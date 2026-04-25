import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Link } from './link.entity';

export type InteractionAction = 'read' | 'deleted' | 'snoozed';

@Entity()
export class LinkInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.interactions, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Link, (link) => link.interactions, { onDelete: 'CASCADE' })
  link: Link;

  @Column({ type: 'varchar' })
  action: InteractionAction;

  @CreateDateColumn()
  createdAt: Date;
}
