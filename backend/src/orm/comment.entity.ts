import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';   
  
import { User } from './user.entity';
import { Idea } from './idea.entity';

@Entity()
export class Comments {
  
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date; 

    @Column()
    comment: string;
    
    @Column()
    grade: string;

    @ManyToOne(() => User, (user) => user.comment, { onDelete: 'CASCADE' })
    users: User;

    @ManyToOne(() => Idea, (idea) => idea.comment, { onDelete: 'CASCADE' })
    idea: Idea;
}