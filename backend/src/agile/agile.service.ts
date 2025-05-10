import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TypeAgile, UpdateAgileDto } from 'src/common/types';
import { Agile } from 'src/orm/agile.entity';
import { Project } from 'src/orm/project.entity';

@Injectable()
export class AgileService {
  constructor(
    @InjectRepository(Agile)
    private readonly agileRepository: Repository<Agile>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findAll(): Promise<Agile[]> {
    return this.agileRepository.find({ relations: ['project'] });
  }
  
  async findOne(id: number): Promise<Agile | any> {
    const agile = await this.agileRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    return agile;
  }

  async create(
    name: string,
    type: TypeAgile,
    project: number,
  ): Promise<Agile> {
    const agile = new Agile();
    agile.name = name;
    agile.type = type;
    const projectEntity = await this.projectRepository.findOne({ where: { id: project } });

    if (!projectEntity) {throw new NotFoundException(`Project with id ${project} not found`)}
    agile.project = projectEntity;
    return this.agileRepository.save(agile);
  }

  async update(id: number, updateAgileDto: UpdateAgileDto): Promise<Agile> {
    const agile = await this.agileRepository.findOne({ where: { id }, relations: ['project'] });

    if (!agile) {
        throw new NotFoundException(`Agile с id ${id} не найдена`);
    }

    // Обновите другие поля
    Object.assign(agile, updateAgileDto);

    return this.agileRepository.save(agile);
  }

  async remove(id: number): Promise<void> {
    const agile = await this.agileRepository.findOne({ where: { id } });
    if (!agile) {
      throw new NotFoundException(`Agile with id ${id} not found`);
    }
  
    await this.agileRepository.remove(agile);    
  }
}