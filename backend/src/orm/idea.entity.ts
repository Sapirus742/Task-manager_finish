
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';   
  
import { User } from './user.entity';
  
import { Competence, IdeaDto, StatusIdea } from 'src/common/types'; 
import { Comments } from './comment.entity';

@Entity()
export class Idea {
  
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
    
    @Column({ default: StatusIdea.new })
    status: StatusIdea;
    
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date; 

    @Column()
    customer: string;

    @OneToMany(() => Comments, (comments) => comments.idea)
    comment: Comments[];    
    
    @ManyToOne(() => User, (user) => user.idea_initiator, { onDelete: 'CASCADE' })
    initiator: User;

    getIdeaDto(): IdeaDto {
        return {
            id: this.id,
            name: this.name,
            problem: this.problem,
            solution: this.solution,
            result: this.result,
            resource: this.resource,
            stack: this.stack,
            status: this.status,
            createdAt: this.createdAt,
            comment: this.comment.map(comment => comment.getCommentDto()),
            customer: this.customer,
            initiator: this.initiator.getSecuredDto(),
        };
    }
}