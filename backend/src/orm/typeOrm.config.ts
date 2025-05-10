import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from './user.entity';
import { Team } from './team.entity';
import { Idea } from './idea.entity';
import { Portfolio } from './portfolio.entity';
import { Project } from './project.entity';
import { Comments } from './comment.entity';
import { Exchange } from './exchange.entity';
import { Agile } from './agile.entity';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [User, Team, Comments, Idea, Portfolio, Project, Exchange, Agile],

  migrations: ['dist/orm/migrations/*.js'],
});