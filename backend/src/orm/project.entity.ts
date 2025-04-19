import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToMany,
    ManyToOne,
    OneToOne,
    JoinColumn,
} from 'typeorm';   
  
import { User } from './user.entity';
  
import { Competence, ProjectDto, StatusProject } from 'src/common/types'; 
import { Team } from './team.entity';
import { Idea } from './idea.entity';
import { Exchange } from './exchange.entity';
import { Agile } from './agile.entity';

@Entity()
export class Project {
  
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @Column()
    problem: string;

    @Column()
    solution: string;

    @Column()
    result: string;

    @Column()
    resource: string;

    @Column({ type: 'varchar', array: true, default: '{}' })
    stack: Competence[];

    @Column({ default: StatusProject.searchTeam })
    status: StatusProject;
    
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;  

    @Column()
    startProject: Date;

    @Column()
    stopProject: Date;

    @Column()
    maxUsers: string;

    @Column()
    customer: string;

    @OneToOne(() => Idea, (idea) => idea.project, { onDelete: 'SET NULL' })
    @JoinColumn()
    idea: Idea;
    
    @OneToMany(() => Team, (team) => team.project)
    teams: Team[];

    @OneToMany(() => Agile, (agile) => agile.project)
    agile: Agile[];

    @ManyToOne(() => Exchange, (exchange) => exchange.projects, { onDelete: 'SET NULL' })
    exchange: Exchange;

    @ManyToOne(() => User, (user) => user.project_initiator, { onDelete: 'CASCADE' })
    initiator: User;
    
    getProjectDto(): ProjectDto {
        return {
            id: this.id,
            name: this.name,
            problem: this.problem,
            solution: this.solution,
            result: this.result,
            resource: this.resource,
            stack: this.stack,
            status: this.status,
            startProject: this.startProject,
            stopProject: this.stopProject,
            maxUsers: this.maxUsers,
            teams: this.teams.map(team => team.getTeamDto()), 
            agile: this.agile.map(agile => agile.getAgileDto()),
            customer: this.customer,
            exchange: this.exchange.getExchangeDto(),
            initiator: this.initiator.getSecuredDto(),
        };
    }
}