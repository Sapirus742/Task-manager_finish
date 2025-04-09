import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';   
  
import {  ExchangeDto } from 'src/common/types'; 
import { Project } from './project.entity';

@Entity()
export class Exchange {
  
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;
    
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;  

    @Column()
    startExchange: Date;

    @Column()
    stopExchange: Date;
    
    @OneToMany(() => Project, (projects) => projects.exchange)
    projects: Project[];
    
    getExchangeDto(): ExchangeDto {
        return {
            id: this.id,
            name: this.name,
            startExchange: this.startExchange,
            stopExchange: this.stopExchange,
            projects: this.projects.map(project => project.getProjectDto()), 
        };
    }
}