import { PartialType } from '@nestjs/mapped-types';
import { CreateExamAttemptDto } from './create-exam-attempt.dto';

export class UpdateExamAttemptDto extends PartialType(CreateExamAttemptDto) {}
