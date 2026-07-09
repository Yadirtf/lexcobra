import { FastifyInstance } from 'fastify';
import prisma from '../../infrastructure/database/prisma.client.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { onlySuperAdmin } from '../middlewares/rbac.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';
import fs from 'fs';
import path from 'path';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', onlySuperAdmin);

  // GET: Listar todos los departamentos con sus municipios
  fastify.get('/locations', async (request, reply) => {
    try {
      const departamentos = await prisma.departamento.findMany({
        include: { municipios: true },
        orderBy: { nombre: 'asc' },
      });
      return reply.send(successResponse(departamentos));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al obtener ubicaciones'));
    }
  });

  // POST: Sincronizar (forzar semilla) de ubicaciones desde colombia.json
  fastify.post('/locations/sync', async (request, reply) => {
    try {
      const colombiaDataPath = path.join(process.cwd(), 'prisma/data/colombia.json');
      if (!fs.existsSync(colombiaDataPath)) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'No se encontró el archivo colombia.json'));
      }

      const colombiaData = JSON.parse(fs.readFileSync(colombiaDataPath, 'utf8'));
      let deptCount = 0;
      let munCount = 0;

      for (const item of colombiaData) {
        // Upsert departamento
        let depto = await prisma.departamento.findFirst({ where: { nombre: item.departamento } });
        if (!depto) {
          depto = await prisma.departamento.create({ data: { nombre: item.departamento } });
          deptCount++;
        }

        // Upsert municipios
        for (const ciudad of item.ciudades) {
          const existingMun = await prisma.municipio.findFirst({
            where: { departamentoId: depto.id, nombre: ciudad },
          });
          if (!existingMun) {
            await prisma.municipio.create({
              data: { departamentoId: depto.id, nombre: ciudad },
            });
            munCount++;
          }
        }
      }

      return reply.send(successResponse({ deptCount, munCount, message: 'Sincronización completada' }));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al sincronizar ubicaciones'));
    }
  });
}
