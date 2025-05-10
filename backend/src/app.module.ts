import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from './orm/user.entity';
import { Team } from './orm/team.entity';
import { Idea } from './orm/idea.entity';
import { Portfolio } from './orm/portfolio.entity';
import { Project } from './orm/project.entity';
import { Comments } from './orm/comment.entity';
import { ProjectModule } from './project/project.module';
import { TeamModule } from './team/team.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { IdeaModule } from './idea/idea.module';
import { CommentModule } from './comment/comment.module';
import { Exchange } from './orm/exchange.entity';
import { ExchangeModule } from './exchange/exchange.module';
import { Agile } from './orm/agile.entity';
import { AgileModule } from './agile/agile.module';
 

@Module({

  imports: [
    AgileModule,
    ExchangeModule,
    CommentModule,
    IdeaModule,
    PortfolioModule,
    TeamModule,
    ProjectModule,
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        cache: true,
        entities: [User, Team, Comments, Idea, Portfolio, Project, Exchange, Agile],
        maxQueryExecutionTime: 5000,
        extra: {
          max: 50,
          connectionTimeoutMillis: 1000,
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Team, Comments, Idea, Portfolio, Project, Exchange, Agile]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
