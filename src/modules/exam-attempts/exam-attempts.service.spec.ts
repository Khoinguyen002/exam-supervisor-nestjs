import { Test, TestingModule } from '@nestjs/testing';
import { ExamAttemptsService } from './exam-attempts.service';

describe('ExamAttemptsService', () => {
  let service: ExamAttemptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExamAttemptsService],
    }).compile();

    service = module.get<ExamAttemptsService>(ExamAttemptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
