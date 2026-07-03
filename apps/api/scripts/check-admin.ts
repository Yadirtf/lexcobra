import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({
    where: { clienteId: null },
    include: { usuarioRoles: { include: { rol: true } } }
  });
  console.log("Super Admins:");
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
