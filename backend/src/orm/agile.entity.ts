import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';   
  
import {  AgileDto, TypeAgile } from 'src/common/types'; 
import { Project } from './project.entity';

@Entity()
export class Agile {
  
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @Column()
    type: TypeAgile;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date; 

    @ManyToOne(() => Project, (project) => project.agile, { onDelete: 'CASCADE' })
    project: Project;

    getAgileDto(): AgileDto {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            createdAt: this.createdAt,
            project: this.project.getProjectDto(),
        };
    }
}