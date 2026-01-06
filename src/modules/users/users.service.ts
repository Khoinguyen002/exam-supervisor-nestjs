import { Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { hashToken } from 'src/common/helper/token';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  async create(dto: CreateUserDto) {
    const passwordHash = hashToken(dto.password);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
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
