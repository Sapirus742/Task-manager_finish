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
 

@Module({

  imports: [

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
        entities: [User, Team, Comments, Idea, Portfolio, Project],
        maxQueryExecutionTime: 5000,
        extra: {
          max: 50,
          connectionTimeoutMillis: 1000,
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Team, Comments, Idea, Portfolio, Project]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
