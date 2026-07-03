import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'cliente@putumayo.com' } });
  console.log('Cliente User:', user);
  const repUser = await prisma.user.findUnique({ where: { email: 'representante@putumayo.lexcobra.app' } });
  console.log('Rep User:', repUser);
}
main().finally(() => prisma.$disconnect());
