import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/orm/user.entity';
import { Competence, PrivacyTeam, StatusIdea, StatusTeam, UpdateIdeaDto, UpdateTeamDto } from 'src/common/types';
import { Team } from 'src/orm/team.entity';
import { Project } from 'src/orm/project.entity';
import { Idea } from 'src/orm/idea.entity';
import { Comments } from 'src/orm/comment.entity';

@Injectable()
export class IdeaService {
  constructor(
    @InjectRepository(Idea)
    private readonly ideaRepository: Repository<Idea>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Comments)
    private readonly commentsRepository: Repository<Comments>,
  ) {}

  async findAll(): Promise<Idea[]> {
    return this.ideaRepository.find({ relations: ['comment', 'initiator'] });
  }
  
  async findOne(id: number): Promise<Idea | any> {
    const idea = await this.ideaRepository.findOne({
      where: { id },
      relations: ['comment', 'initiator'],
    });
    return idea;
  }
  
  async create(
    name: string,
    problem: string,
    solution: string,
    result: string,
    resource: string,
    stack: Competence[], 
    status: StatusIdea,
    customer: string,
    comment: number[], 
    initiator: number,
  ): Promise<Idea> {
    const idea = new Idea();
    idea.name = name;

    idea.problem = problem;
    idea.solution = solution;
    idea.result = result;
    idea.resource = resource;
    idea.stack = stack;
    idea.status = status;
    idea.customer = customer;
    const initiatorEntity = await this.userRepository.findOne({ where: { id: initiator } });
    const commentEntities = await this.commentsRepository.find({ where: { id: In(comment) } });

    if (!initiatorEntity) {throw new NotFoundException(`Initiator with id ${initiator} not found`)}
    idea.comment = commentEntities;
    idea.initiator = initiatorEntity;
    return this.ideaRepository.save(idea);
  }

  async update(id: number, updateIdeaDto: UpdateIdeaDto): Promise<Idea> {
    const idea = await this.ideaRepository.findOne({ where: { id }, relations: ['comment', 'initiator'] });

    if (!idea) {
        throw new NotFoundException(`Идея с id ${idea} не найдена`);
    }

    // Обновите другие поля
    Object.assign(idea, updateIdeaDto);

    // Обработка обновления комментариев
    if (updateIdeaDto.comment) {
        const comments = await this.commentsRepository.find({ where: { id: In(updateIdeaDto.comment) } });
        if (comments.length === 0) {
            throw new NotFoundException(`Нет комментариев с id ${updateIdeaDto.comment.join(', ')}`);
        }
        idea.comment = comments; // Установите связь с комментариями
    }

    return this.ideaRepository.save(idea);
  }

  async remove(id: number): Promise<void> {
    const idea = await this.ideaRepository.findOne({ where: { id } });

    if (!idea) {
        throw new NotFoundException(`Idea with id ${idea} not found`);
    }

    await this.ideaRepository.remove(idea);
  }
}