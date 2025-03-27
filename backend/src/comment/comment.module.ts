import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from 'src/auth/roles.guard';
import { User } from 'src/orm/user.entity';
import { Idea } from 'src/orm/idea.entity';
import { Comments } from 'src/orm/comment.entity';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Idea, User, Comments])],
  providers: [CommentService, RolesGuard],
  exports: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}