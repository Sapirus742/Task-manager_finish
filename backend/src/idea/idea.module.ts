import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from 'src/auth/roles.guard';
import { User } from 'src/orm/user.entity';
import { Idea } from 'src/orm/idea.entity';
import { Comments } from 'src/orm/comment.entity';
import { IdeaService } from './idea.service';
import { IdeaController } from './idea.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Idea, User, Comments])],
  providers: [IdeaService, RolesGuard],
  exports: [IdeaService],
  controllers: [IdeaController],
})
export class IdeaModule {}