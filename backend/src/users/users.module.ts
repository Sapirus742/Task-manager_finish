import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/orm/user.entity';
import { UsersController } from './users.controller';
import { RolesGuard } from 'src/auth/roles.guard';
import { Team } from 'src/orm/team.entity';
import { Project } from 'src/orm/project.entity';
import { Portfolio } from 'src/orm/portfolio.entity';
import { Comments } from 'src/orm/comment.entity';
import { Idea } from 'src/orm/idea.entity';
import { Message } from 'src/orm/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team, Project, Portfolio, Comments, Idea, Message])],
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}