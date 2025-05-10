import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgileService } from './agile.service';
import { AgileController } from './agile.controller';
import { Agile } from 'src/orm/agile.entity';
import { Project } from 'src/orm/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agile, Project])],
  providers: [AgileService],
  exports: [AgileService],
  controllers: [AgileController],
})
export class AgileModule {}