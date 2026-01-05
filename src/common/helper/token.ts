import * as bcrypt from 'bcrypt';
import { PASSWORD_SALT } from 'src/common/config/env';

export function hashToken(token: string) {
  return bcrypt.hashSync(token, PASSWORD_SALT);
}

export function compareToken(token: string, tokenHash: string) {
  return bcrypt.compareSync(token, tokenHash);
}
