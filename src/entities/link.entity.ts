import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tag.entity';
import { LinkInteraction } from './link-interaction.entity';

@Entity()
export class Link {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.links)
  user: User;

  @ManyToMany(() => Tag, (tag) => tag.links)
  tags: Tag[];

  @OneToMany(() => LinkInteraction, (interaction) => interaction.link)
  interactions: LinkInteraction[];
}
