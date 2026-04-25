import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Link } from './link.entity';
import { UserSettings } from './user-settings.entity';
import { Tag } from './tag.entity';
import { LinkInteraction } from './link-interaction.entity';
import { ReadingPattern } from './reading-pattern.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  telegramId: number;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Link, (link) => link.user)
  links: Link[];

  @OneToOne(() => UserSettings, (settings) => settings.user)
  settings: UserSettings;

  @OneToMany(() => Tag, (tag) => tag.user)
  tags: Tag[];

  @OneToMany(() => LinkInteraction, (interaction) => interaction.user)
  interactions: LinkInteraction[];

  @OneToOne(() => ReadingPattern, (pattern) => pattern.user)
  readingPattern: ReadingPattern;
}
