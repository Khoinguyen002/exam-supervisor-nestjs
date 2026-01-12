import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExamsService } from './exams.service';
import { ExamAttemptsService } from '../exam-attempts/exam-attempts.service';

@Injectable()
export class ExamSchedulerService {
  private readonly logger = new Logger(ExamSchedulerService.name);

  constructor(
    private readonly examsService: ExamsService,
    private readonly examAttemptsService: ExamAttemptsService,
  ) {}

  // Run every minute to check for state transitions
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExamStateTransitions() {
    try {
      this.logger.debug('Checking exam state transitions...');

      // Update exam states based on time
      await this.examsService.checkAndUpdateExamStates();

      // Auto-submit expired attempts
      const autoSubmittedCount =
        await this.examAttemptsService.checkAndAutoSubmitExpiredAttempts();

      if (autoSubmittedCount > 0) {
        this.logger.log(
          `Auto-submitted ${autoSubmittedCount} expired exam attempts`,
        );
      }
    } catch (error) {
      this.logger.error('Error in exam state transitions:', error);
    }
  }

  // Run every 5 minutes for less critical checks
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePeriodicCleanup() {
    try {
      this.logger.debug('Running periodic cleanup...');
      // Add any additional periodic tasks here
    } catch (error) {
      this.logger.error('Error in periodic cleanup:', error);
    }
  }
}
