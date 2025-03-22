import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/orm/user.entity';
import * as bcrypt from 'bcrypt';
import { PrivacyTeam, Role, StatusTeam, UpdateTeamDto, UpdateUserDto, UserAccountStatus } from 'src/common/types';
import { Team } from 'src/orm/team.entity';
import { Project } from 'src/orm/project.entity';

@Injectable()
export class TeamService {
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
    privacy: PrivacyTeam.open,    
    status: StatusTeam.searchProject,
    user_leader: number,
    user: number[],
    project: number,
    user_owner: number,
  ): Promise<Team> {
    const team = new Team();
    team.name = name;
    team.description = description;
    team.privacy = privacy;
    team.status = status;
    const user_leaderEntity = await this.userRepository.findOne({ where: { id: user_leader } });
    const userEntities = await this.userRepository.find({where: {id: In(user)}},);
    const projectEntity = await this.projectRepository.findOne({ where: { id: project } });
    const user_ownerEntity = await this.userRepository.findOne({ where: { id: user_owner } });

    if (!user_leaderEntity) {throw new NotFoundException(`Initiator with id ${user_leader} not found`)}
    if (userEntities.length == 0) {throw new NotFoundException(`No users found with ids ${user.join(', ')}`)}
    if (!projectEntity) {throw new NotFoundException(`Initiator with id ${project} not found`)}
    if (!user_ownerEntity) {throw new NotFoundException(`Initiator with id ${user_owner} not found`)}
    team.user_leader = user_leaderEntity;
    team.user = userEntities;
    team.project = projectEntity;
    team.user_owner = user_ownerEntity;
    return this.teamRepository.save(team);
  }

  async update(id: number, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { id } });

    if (!team) {
        throw new NotFoundException(`Project with id ${id} not found`);
    }

    // Обновите поля проекта
    Object.assign(team, updateTeamDto);

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