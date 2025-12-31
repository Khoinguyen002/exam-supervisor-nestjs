import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT } from 'src/common/config/env';

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, PASSWORD_SALT);
}

export function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compareSync(password, passwordHash);
}
