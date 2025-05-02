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
import { CreateAgileDto, UpdateAgileDto } from 'src/common/types';
import { AgileService } from './agile.service';
import { Agile } from 'src/orm/agile.entity';

@Controller('agile')

export class AgileController {
  private readonly logger = new Logger(AgileController.name);

  constructor(private agileService: AgileService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Agile[]> {
    return this.agileService.findAll();
  }
 
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number): Promise<Agile> {
    return this.agileService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() agile: CreateAgileDto): Promise<Agile> {
    return this.agileService.create(
      agile.name,
      agile.type,
      agile.project,
    );
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() updateAgileDto: UpdateAgileDto): Promise<Agile> {
      return this.agileService.update(id, updateAgileDto);
  }
 
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
      return this.agileService.remove(id);
  }
}