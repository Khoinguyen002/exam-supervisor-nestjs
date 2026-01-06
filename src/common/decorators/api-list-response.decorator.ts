import { SetMetadata } from '@nestjs/common';
import {
  RESPONSE_MESSAGE_KEY,
  RESPONSE_TYPE_KEY,
  ResponseType,
} from '../constants/response.constants';

export const ApiListResponse = (message?: string) =>
  SetMetadata(RESPONSE_TYPE_KEY, ResponseType.LIST) &&
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
