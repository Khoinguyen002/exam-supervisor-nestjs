import { Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { hashToken } from 'src/common/helper/token';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        omit: {
          password: true,
          refreshToken: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: users,
      total,
      page,
      limit,
    };
  }

  async create(dto: CreateUserDto) {
    const passwordHash = hashToken(dto.password);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        role: dto.role,
      },
    });
  }

  async getByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async getById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: string, updateData: UpdateUserDto) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: updateData,
      omit: {
        password: true,
      },
    });
  }
}
