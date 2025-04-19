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
import { Message } from './message.entity';

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

    @OneToMany(() => Message, (message) => message.agile)
    message: Message[];

    @ManyToOne(() => Project, (project) => project.agile, { onDelete: 'CASCADE' })
    project: Project;

    getAgileDto(): AgileDto {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            createdAt: this.createdAt,
            message: this.message.map(message => message.getMessageDto()),
            project: this.project.getProjectDto(),
        };
    }
}