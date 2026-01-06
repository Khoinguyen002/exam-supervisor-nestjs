import { Test, TestingModule } from '@nestjs/testing';
import { ExamAttemptsController } from './exam-attempts.controller';
import { ExamAttemptsService } from './exam-attempts.service';

describe('ExamAttemptsController', () => {
  let controller: ExamAttemptsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamAttemptsController],
      providers: [ExamAttemptsService],
    }).compile();

    controller = module.get<ExamAttemptsController>(ExamAttemptsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
