import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import {
  LinkInteraction,
  InteractionAction,
} from '../entities/link-interaction.entity';
import { User } from '../entities/user.entity';
import { Link } from '../entities/link.entity';

@Injectable()
export class LinkInteractionsService {
  private readonly logger = new Logger(LinkInteractionsService.name);

  constructor(
    @InjectRepository(LinkInteraction)
    private linkInteractionsRepository: Repository<LinkInteraction>,
  ) {}

  async log(user: User, link: Link, action: InteractionAction): Promise<void> {
    const interaction = this.linkInteractionsRepository.create({
      user,
      link,
      action,
    });
    await this.linkInteractionsRepository.save(interaction);
    this.logger.log(
      `Logged interaction: user=${user.id} link=${link.id} action=${action}`,
    );
  }

  async getInteractionsSince(
    user: User,
    since: Date,
  ): Promise<LinkInteraction[]> {
    return this.linkInteractionsRepository.find({
      where: {
        user: { id: user.id },
        createdAt: MoreThanOrEqual(since),
      },
      order: { createdAt: 'ASC' },
    });
  }
}
