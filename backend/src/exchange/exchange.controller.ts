import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CreateExchangeDto,  Role, UpdateExchangeDto } from 'src/common/types';
import { RolesGuard } from 'src/auth/roles.guard';
import { ExchangeService } from './exchange.service';
import { Exchange } from 'src/orm/exchange.entity';


@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Exchange[]> {
    return this.exchangeService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number): Promise<Exchange> {
    return this.exchangeService.findOne(id);
  }

  @Post()
  @Roles(Role.admin, Role.directorate)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() exchange: CreateExchangeDto): Promise<Exchange> {
    return this.exchangeService.create(
      exchange.name,
      exchange.startExchange,
      exchange.stopExchange,
    );
  }

  @Patch(':id')
  @Roles(Role.admin, Role.directorate)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Param('id') id: number, @Body() updateExchangeDto: UpdateExchangeDto): Promise<Exchange> {
      return this.exchangeService.update(id, updateExchangeDto);
  }

  @Delete(':id')
  @Roles(Role.admin, Role.directorate) 
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: number): Promise<void> {
      return this.exchangeService.remove(id);
  }

  @Patch(':id/projects')
@Roles(Role.admin, Role.directorate)
@UseGuards(JwtAuthGuard, RolesGuard)
async updateProjects(
  @Param('id') id: number,
  @Body() body: { projects: number[] }
): Promise<Exchange> {
  return this.exchangeService.update(id, { projects: body.projects });
}
}