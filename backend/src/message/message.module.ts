import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/orm/user.entity';
import { Agile } from 'src/orm/agile.entity';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { Message } from 'src/orm/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agile, User, Message])],
  providers: [MessageService],
  exports: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}