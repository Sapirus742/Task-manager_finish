import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from 'src/auth/roles.guard';
import { Exchange } from 'src/orm/exchange.entity';
import { ExchangeService } from './exchange.service';
import { ExchangeController } from './exchange.controller';
import { Project } from 'src/orm/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exchange, Project])],
  controllers: [ExchangeController],
  exports: [ExchangeService],
  providers: [ExchangeService, RolesGuard],
})
export class ExchangeModule {}