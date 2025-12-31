import { JwtSignOptions } from '@nestjs/jwt';
import 'dotenv/config';

export const DATABASE_URL = process.env.DATABASE_URL;
export const PASSWORD_SALT = Number(process.env.PASSWORD_SALT);

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRATION = process.env
  .JWT_EXPIRATION as JwtSignOptions['expiresIn'];
