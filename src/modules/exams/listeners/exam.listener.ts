import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ExamListener {
  @OnEvent('exam.published')
  handleExamPublished(payload: { examId: string }) {
    console.log('Exam published:', payload);

    // notify
    // cache
    // audit
  }
}
