import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User as UserModal } from '@prisma/client';

export const User = createParamDecorator(
  (key: keyof UserModal, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return key ? request.user?.[key] : request.user;
  },
);
