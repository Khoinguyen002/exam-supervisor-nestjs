import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { QuestionsModule } from './modules/questions/questions.module';
import { ExamsModule } from './modules/exams/exams.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { ExamQuestionsModule } from './modules/exam-questions/exam-questions.module';
import { ExamAttemptsModule } from './modules/exam-attempts/exam-attempts.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    QuestionsModule,
    ExamsModule,
    EventEmitterModule.forRoot(),
    ExamQuestionsModule,
    ExamAttemptsModule,
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
