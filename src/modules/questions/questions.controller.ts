import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ApiResponse } from 'src/common/decorators/api-response.decorator';
import { ApiListResponse } from 'src/common/decorators/api-list-response.decorator';

@Roles('ADMIN', 'EXAMINER')
@Controller('admin/questions')
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @ApiResponse('Create question successfully')
  @Post()
  create(@Body() dto: CreateQuestionDto) {
    return this.service.create(dto);
  }

  @ApiListResponse('Get questions successfully')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiResponse('Get question successfully')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiResponse('Update question successfully')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.service.update(id, dto);
  }

  @ApiResponse('Delete question successfully')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
