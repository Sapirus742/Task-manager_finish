import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/orm/user.entity';
import { Competence, StatusIdea, UpdateIdeaDto } from 'src/common/types';
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
    return this.ideaRepository.find({ relations: ['comment', 'initiator', 'project'] });
  }
  
  async findOne(id: number): Promise<Idea | any> {
    const idea = await this.ideaRepository.findOne({
      where: { id },
      relations: ['comment', 'initiator', 'project'],
    });
    return idea;
  }

  async addApproved(id: number, app: number): Promise<Idea> {
    const idea = await this.ideaRepository.findOne({
      where: { id },
      relations: ['comment', 'initiator'],
    });
  
    if (!idea) {
      throw new NotFoundException(`Идея с id ${id} не найдена`);
    }
  
    if (idea.status !== StatusIdea.endorsed) {
      throw new BadRequestException('Only endorsed ideas can be approved');
    }
  
    const alreadyApproved = idea.approved.includes(app);
    if (alreadyApproved) {
      throw new BadRequestException('User already approved this idea');
    }
    
    idea.approved = [...idea.approved, app];
    
    // Проверяем количество одобрений
    if (idea.approved.length >= 3) {
      idea.status = StatusIdea.published; // Меняем сразу на Published
    }
    
    return this.ideaRepository.save(idea);
  }

  async create(
    name: string,
    problem: string,
    solution: string,
    result: string,
    resource: string,
    stack: Competence[], 
    status: StatusIdea,
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
        throw new NotFoundException(`Идея с id ${id} не найдена`);
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

  async endorseIdea(id: number): Promise<Idea> {
    const idea = await this.ideaRepository.findOne({ 
      where: { id },
      relations: ['initiator', 'comment']
    });
    
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }
    
    if (idea.status !== StatusIdea.new) {
      throw new BadRequestException('Only new ideas can be endorsed');
    }
    
    idea.status = StatusIdea.endorsed;
    return this.ideaRepository.save(idea);
  }

  async remove(id: number): Promise<void> {
    const idea = await this.ideaRepository.findOne({ where: { id } });
    if (!idea) {
      throw new NotFoundException(`Idea with id ${id} not found`);
    }
  
    // Вместо удаления меняем статус
    idea.status = StatusIdea.fordeletion;
    await this.ideaRepository.save(idea);
    
    
  }
}