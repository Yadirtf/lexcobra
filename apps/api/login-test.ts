import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'representante@putumayo.lexcobra.app' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  const valid = await bcrypt.compare('Representante@2025!', user.passwordHash);
  console.log('Password valid:', valid);
}

main().finally(() => prisma.$disconnect());
