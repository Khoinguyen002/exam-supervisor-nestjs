import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../../common/decorators/user.decorator';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import type { User as UserModal } from '@prisma/client';
import { ApiResponse } from 'src/common/decorators/api-response.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiListResponse } from 'src/common/decorators/api-list-response.decorator';

@Roles('ADMIN', 'EXAMINER')
@Controller('admin/exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  create(@User() user: UserModal, @Body() dto: CreateExamDto) {
    return this.examsService.create(user.id, dto);
  }

  @Get()
  @ApiListResponse('List of exams')
  findAll(@User() user: UserModal, @Query() query: PaginationQueryDto) {
    return this.examsService.findAll(user, query);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
    @User() user: UserModal,
  ) {
    return this.examsService.update(id, dto, user);
  }

  @Post(':id/duplicate')
  @ApiResponse('Exam duplicated successfully')
  duplicate(@Param('id') id: string, @User() user: UserModal) {
    return this.examsService.duplicate(id, user);
  }

  @ApiResponse('Exam published')
  @Patch(':id/publish')
  publish(@Param('id') id: string, @User() user: UserModal) {
    return this.examsService.publish(id, user);
  }

  @Patch(':id/unpublish')
  unPublish(@Param('id') id: string, @User() user: UserModal) {
    return this.examsService.unPublish(id, user);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @User() user: UserModal) {
    return this.examsService.archive(id, user);
  }
}
