import {
    Body,
    Controller,
    Delete,
    Get,
    Logger,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateCommentDto, UpdateCommentDto } from 'src/common/types';
import { RolesGuard } from 'src/auth/roles.guard';
import { CommentService } from './comment.service';
import { Comments } from 'src/orm/comment.entity';

@Controller('comment')

export class CommentController {
  private readonly logger = new Logger(CommentController.name);

  constructor(private commentService: CommentService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Comments[]> {
    return this.commentService.findAll();
  }
 
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number): Promise<Comments> {
    return this.commentService.findOne(id);
  }
  
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() comments: CreateCommentDto): Promise<Comments> {
    return this.commentService.create(
      comments.comment,
      comments.users,
      comments.idea,
    );
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() updateCommentDto: UpdateCommentDto): Promise<Comments> {
    return this.commentService.update(id, updateCommentDto);
  }
 
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.commentService.remove(id);
  }

  @Get('idea/:ideaId')
@UseGuards(JwtAuthGuard)
async findByIdeaId(@Param('ideaId') ideaId: number): Promise<Comments[]> {
  return this.commentService.findByIdeaId(ideaId);
}
}