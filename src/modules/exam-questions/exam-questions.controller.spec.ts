import { Test, TestingModule } from '@nestjs/testing';
import { ExamQuestionsController } from './exam-questions.controller';
import { ExamQuestionsService } from './exam-questions.service';

describe('ExamQuestionsController', () => {
  let controller: ExamQuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamQuestionsController],
      providers: [ExamQuestionsService],
    }).compile();

    controller = module.get<ExamQuestionsController>(ExamQuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
