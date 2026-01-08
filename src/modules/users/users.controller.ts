import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { type User as UserModal } from '@prisma/client';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { User } from 'src/common/decorators/user.decorator';
import { ApiListResponse } from 'src/common/decorators/api-list-response.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserPublicInfoDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMIN')
  @Get()
  @ApiListResponse()
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  getProfile(@User() user: UserModal): UserResponseDto {
    return plainToInstance(UserResponseDto, user);
  }

  @Post()
  create(@Body() body: CreateUserDto) {
    this.usersService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateUserPublicInfoDto,
  ): UserResponseDto {
    return plainToInstance(UserResponseDto, this.usersService.update(id, body));
  }

  @Roles('ADMIN')
  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
  ): UserResponseDto {
    return plainToInstance(UserResponseDto, this.usersService.update(id, body));
  }
}
