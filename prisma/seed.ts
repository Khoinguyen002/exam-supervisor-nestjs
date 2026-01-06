import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { PASSWORD_SALT } from 'src/common/config/env';

const prisma = new PrismaService();
async function main() {
  const passwordHash = await bcrypt.hash('password123', PASSWORD_SALT);

  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: passwordHash,
    },
  });

  console.log('Seeded user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
