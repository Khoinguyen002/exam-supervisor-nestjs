import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuestionsModule } from '../questions/questions.module';
import { ExamsModule } from '../exams/exams.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExamQuestionsModule } from '../exam-questions/exam-questions.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    QuestionsModule,
    ExamsModule,
    EventEmitterModule.forRoot(),
    ExamQuestionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
