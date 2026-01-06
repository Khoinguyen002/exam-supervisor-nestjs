import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../../common/decorators/user.decorator';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import type { User as UserModal } from '@prisma/client';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
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
  findAll(@Query() query: PaginationQueryDto) {
    return this.examsService.findAll(query);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
    @User() user: UserModal,
  ) {
    return this.examsService.update(id, dto, user);
  }

  @ApiResponse('Exam published')
  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.examsService.publish(id);
  }

  @Patch(':id/unpublish')
  unPublish(@Param('id') id: string) {
    return this.examsService.unPublish(id);
  }
}
