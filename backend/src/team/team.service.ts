import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/orm/user.entity';
import { PrivacyTeam, StatusTeam, UpdateTeamDto } from 'src/common/types';
import { Team } from 'src/orm/team.entity';
import { Project } from 'src/orm/project.entity';

@Injectable()
export class TeamService {
private readonly logger = new Logger(TeamService.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findAll(): Promise<Team[]> {
    return this.teamRepository.find({ relations: ['user_leader', 'user', 'portfolio', 'project', 'user_owner'] });
  }
  
  async findOne(id: number): Promise<Team | any> {
    const project = await this.teamRepository.findOne({
      where: { id },
      relations: ['user_leader', 'user', 'portfolio', 'project', 'user_owner'],
    });
    return project;
  }
  
  async create(
    name: string,        
    description: string,        
    privacy: PrivacyTeam,    
    status: StatusTeam,
    user_leader: number | undefined,
    user: number[],
    project: number | null,
    user_owner: number,
  ): Promise<Team> {
    const team = new Team();
    team.name = name;
    team.description = description;
    team.privacy = privacy;
    team.status = status;
    const user_leaderEntity = await this.userRepository.findOne({ where: { id: user_leader } });
    const userEntities = await this.userRepository.find({where: {id: In(user)}});
    // Обрабатываем проект (может быть null)
    if (project !== null) {
      const projectEntity = await this.projectRepository.findOne({ where: { id: project } });
      if (!projectEntity) {
        throw new NotFoundException(`Project with id ${project} not found`);
      }
      team.project = projectEntity;
    } else {
      team.project = null; // Явно устанавливаем null, если проект не указан
    }
    const user_ownerEntity = await this.userRepository.findOne({ where: { id: user_owner } });

    if (!user_leaderEntity) {throw new NotFoundException(`Initiator with id ${user_leader} not found`)}
    if (userEntities.length == 0) {throw new NotFoundException(`No users found with ids ${user.join(', ')}`)}
    if (!user_ownerEntity) {throw new NotFoundException(`Initiator with id ${user_owner} not found`)}
    team.user_leader = user_leaderEntity;
    team.user = userEntities;
    team.user_owner = user_ownerEntity;
    return this.teamRepository.save(team);
  }

  async update(id: number, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { id }, relations: ['user'] });

    if (!team) {
        throw new NotFoundException(`Команда с id ${id} не найдена`);
    }

    // Обновите другие поля
    Object.assign(team, updateTeamDto);

    // Обработка обновления пользователей
    if (updateTeamDto.user) {
        const users = await this.userRepository.find({where: {id: In(updateTeamDto.user)}});
        team.user = users; // Установите связь с пользователями
    }

    return this.teamRepository.save(team);
  }

  async remove(id: number): Promise<void> {
    const team = await this.teamRepository.findOne({ where: { id } });

    if (!team) {
        throw new NotFoundException(`Project with id ${id} not found`);
    }

    await this.teamRepository.remove(team);
  }
}