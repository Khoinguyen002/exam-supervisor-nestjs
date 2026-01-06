import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs/operators';
import {
  RESPONSE_MESSAGE_KEY,
  RESPONSE_TYPE_KEY,
  ResponseType,
} from '../constants/response.constants';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const handler = context.getHandler();
    const clazz = context.getClass();

    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, handler) ??
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, clazz);

    const type =
      this.reflector.get<ResponseType>(RESPONSE_TYPE_KEY, handler) ??
      ResponseType.SINGLE;

    return next.handle().pipe(
      map((result) => {
        // LIST response
        if (type === ResponseType.LIST) {
          const { items, total, page, limit } = result;

          return {
            success: true,
            data: items,
            meta: { total, page, limit },
            ...(message && { message }),
          };
        }

        // SINGLE response
        return {
          success: true,
          data: result,
          ...(message && { message }),
        };
      }),
    );
  }
}
