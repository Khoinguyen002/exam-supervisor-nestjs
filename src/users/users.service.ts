import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  async create(dto: CreateUserDto) {
    const passwordHash = bcrypt.hashSync(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
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
