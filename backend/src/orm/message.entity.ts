import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';   
  
import { User } from './user.entity';
import { MessageDto } from 'src/common/types';
import { Agile } from './agile.entity';

@Entity()
export class Message {
  
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date; 

    @Column()
    message: string;

    @ManyToOne(() => User, (user) => user.comment, { onDelete: 'CASCADE' })
    users: User;

    @ManyToOne(() => Agile, (agile) => agile.message, { onDelete: 'CASCADE' })
    agile: Agile;

    getMessageDto(): MessageDto {
        return {
            id: this.id,
            createdAt: this.createdAt,
            message: this.message,
            agile: this.agile.getAgileDto(),
            users: this.users.getSecuredDto(),
        };
    }
}