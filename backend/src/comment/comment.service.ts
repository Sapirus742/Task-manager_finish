import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/orm/user.entity';
import { UpdateCommentDto } from 'src/common/types';
import { Comments } from 'src/orm/comment.entity';
import { Idea } from 'src/orm/idea.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comments)
    private readonly commentRepository: Repository<Comments>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
  ) {}

  async findAll(): Promise<Comments[]> {
    return this.commentRepository.find({ relations: ['users', 'idea'] });
  }
  
  async findOne(id: number): Promise<Comments | any> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['users', 'idea'],
    });
    return comment;
  }
  
  async create(
    comment: string,
    users: number,
    idea: number,
  ): Promise<Comments> {
    const comments = new Comments();
    comments.comment = comment;
    const usersEntity = await this.userRepository.findOne({ where: { id: users } });
    const ideaEntity = await this.ideaRepository.findOne({ where: { id: idea } });

    if (!usersEntity) {throw new NotFoundException(`User with id ${users} not found`)}
    if (!ideaEntity) {throw new NotFoundException(`Initiator with id ${idea} not found`)}
    comments.users = usersEntity;
    comments.idea = ideaEntity;
    return this.commentRepository.save(comments);
  }

  async update(id: number, updateCommentDto: UpdateCommentDto): Promise<Comments> {
    const comments = await this.commentRepository.findOne({ where: { id }, relations: ['users', 'idea'] });

    if (!comments) {
        throw new NotFoundException(`Коментарий с id ${id} не найдена`);
    }

    // Обновите другие поля
    Object.assign(comments, updateCommentDto);

    return this.commentRepository.save(comments);
  }

  async remove(id: number): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id } });

    if (!comment) {
        throw new NotFoundException(`Comment with id ${id} not found`);
    }

    await this.commentRepository.remove(comment);
  }

  async findByIdeaId(ideaId: number): Promise<Comments[]> {
    return this.commentRepository.find({
      where: { idea: { id: ideaId } },
      relations: ['users', 'idea'],
      order: { createdAt: 'DESC' } // Сортировка по дате
    });
  }
}