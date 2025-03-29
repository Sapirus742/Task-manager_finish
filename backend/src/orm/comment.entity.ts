import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';   
  
import { User } from './user.entity';
import { Idea } from './idea.entity';
import { CommentDto } from 'src/common/types';

@Entity()
export class Comments {
  
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date; 

    @Column()
    comment: string;

    @ManyToOne(() => User, (user) => user.comment, { onDelete: 'CASCADE' })
    users: User;

    @ManyToOne(() => Idea, (idea) => idea.comment, { onDelete: 'CASCADE' })
    idea: Idea;

    getCommentDto(): CommentDto {
        return {
            id: this.id,
            createdAt: this.createdAt,
            comment: this.comment,
            idea: this.idea.getIdeaDto(),
            users: this.users.getSecuredDto(),
        };
    }
}