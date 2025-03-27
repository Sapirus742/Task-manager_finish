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
import { Roles } from 'src/auth/roles.decorator';
import { CreateIdeaDto, Role, UpdateIdeaDto } from 'src/common/types';
import { RolesGuard } from 'src/auth/roles.guard';
import { IdeaService } from './idea.service';
import { Idea } from 'src/orm/idea.entity';

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
  
  @Post()
  @Roles(Role.admin, Role.customer, Role.directorate)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() idea: CreateIdeaDto): Promise<Idea> {
    return this.ideaService.create(
      idea.name,
      idea.problem,
      idea.solution,
      idea.result,
      idea.resource,
      idea.stack,
      idea.status,
      idea.customer,
      idea.comment,
      idea.initiator,
    );
  }
  
  @Patch(':id')
  @Roles(Role.admin, Role.customer, Role.directorate, Role.user)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Param('id') id: number, @Body() updateIdeaDto: UpdateIdeaDto): Promise<Idea> {
      return this.ideaService.update(id, updateIdeaDto);
  }
 
  @Delete(':id')
  @Roles(Role.admin, Role.customer, Role.directorate) 
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number): Promise<void> {
      return this.ideaService.remove(id);
  }
}