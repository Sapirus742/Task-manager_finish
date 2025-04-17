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
import { CreateIdeaDto, Role, UpdateIdeaDto } from 'src/common/types';
import { IdeaService } from './idea.service';
import { Idea } from 'src/orm/idea.entity';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('idea')

export class IdeaController {
  private readonly logger = new Logger(IdeaController.name);

  constructor(private ideaService: IdeaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Idea[]> {
    return this.ideaService.findAll();
  }
 
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number): Promise<Idea> {
    return this.ideaService.findOne(id);
  }

  @Get(':id/:app')
  @Roles(Role.admin, Role.expert)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async addApproved(@Param('id') id: number, @Param('app') app: number): Promise<Idea> {
    return this.ideaService.addApproved(id,app);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() idea: CreateIdeaDto): Promise<Idea> {
    return this.ideaService.create(
      idea.name,
      idea.problem,
      idea.solution,
      idea.result,
      idea.resource,
      idea.stack,
      idea.status,
      idea.comment,
      idea.initiator,
    );
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() updateIdeaDto: UpdateIdeaDto): Promise<Idea> {
      return this.ideaService.update(id, updateIdeaDto);
  }
 
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
      return this.ideaService.remove(id);
  }

  @Patch(':id/endorse')
@Roles(Role.directorate)
@UseGuards(JwtAuthGuard, RolesGuard)
async endorseIdea(@Param('id') id: number): Promise<Idea> {
  return this.ideaService.endorseIdea(id);
}
}