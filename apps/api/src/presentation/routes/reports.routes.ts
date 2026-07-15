import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../../infrastructure/database/prisma.client.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { successResponse, errorResponse } from '../../shared/utils/index.js';
import { buildExcelReport } from '../../shared/utils/excel-generator.js';
import { buildPdfReport } from '../../shared/utils/pdf-generator.js';
import { nanoid } from 'nanoid';

const reportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (debe ser YYYY-MM-DD)').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (debe ser YYYY-MM-DD)').optional(),
  title: z.string().max(200).optional(),
});

const reportLinkBodySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (debe ser YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (debe ser YYYY-MM-DD)'),
  title: z.string().max(200).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional().default(30),
});

// Helper to query portfolio obligations + follow-up info filtered by date
async function getPortfolioReportData(clienteId: string, portfolioId: string, startDateStr: string, endDateStr: string) {
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);

  const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
  const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

  // Validate portfolio
  const portfolio = await prisma.cartera.findFirst({
    where: { id: portfolioId, clienteId }
  });

  if (!portfolio) {
    throw new Error('Cartera no encontrada');
  }

  const obligations = await prisma.obligacion.findMany({
    where: {
      carteraId: portfolioId,
      clienteId,
      isActive: true,
    },
    include: {
      actores: {
        include: {
          persona: {
            include: {
              contactos: {
                include: {
                  tipoContacto: true,
                },
              },
            },
          },
          rolActor: true,
        },
      },
      estadoObligacion: true,
      juzgado: true,
      departamento: true,
      municipio: {
        include: {
          departamento: true,
        },
      },
      medidaCautelar: true,
      nivelRecuperacion: true,
      bitacora: {
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          usuario: {
            select: {
              correo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      recaudos: {
        where: {
          fechaAbonada: {
            gte: start,
            lte: end,
          },
        },
        include: {
          usuario: {
            select: {
              correo: true,
            },
          },
        },
        orderBy: {
          fechaAbonada: 'asc',
        },
      },
      notificaciones: {
        where: {
          fechaNotificacion: {
            gte: start,
            lte: end,
          },
        },
        include: {
          destinatarioPersona: {
            select: {
              nombreCompleto: true,
              numeroIdentificacion: true,
            },
          },
        },
        orderBy: {
          fechaNotificacion: 'asc',
        },
      },
      historialEstados: {
        where: {
          fechaCambio: {
            gte: start,
            lte: end,
          },
        },
        include: {
          usuario: {
            select: {
              correo: true,
            },
          },
          estadoAnterior: true,
          estadoNuevo: true,
          nivelRecuperacionAnterior: true,
          nivelRecuperacionNuevo: true,
        },
        orderBy: {
          fechaCambio: 'asc',
        },
      },
      auditoria: {
        where: {
          fechaCambio: {
            gte: start,
            lte: end,
          },
        },
        include: {
          usuario: {
            select: {
              correo: true,
            },
          },
        },
        orderBy: {
          fechaCambio: 'asc',
        },
      },
    },
  });

  return {
    portfolio,
    obligations,
  };
}

const FIELD_LABELS: Record<string, string> = {
  estadoObligacionId: 'Estado de Obligación',
  nivelRecuperacionId: 'Nivel de Recuperación',
  juzgadoId: 'Juzgado',
  radicado: 'Radicado',
  numeroCredito: 'Número de Crédito',
  saldoCapitalDemandado: 'Saldo Capital Demandado',
  medidaCautelarId: 'Medida Cautelar',
  fechaReparto: 'Fecha de Reparto',
  fechaPresentacionDemanda: 'Fecha de Demanda',
  mandamientoPagoFecha: 'Fecha Mandamiento de Pago',
  autoSeguirEjecucionFecha: 'Fecha Auto Seguir Ejecución',
  liquidacionCreditoAprobadaFecha: 'Fecha Liquidación de Crédito',
};

function resolveValue(campo: string, valor: string | null, catalogs: any): string {
  if (!valor) return 'N/A';
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
  if (!isUUID) {
    if (/^\d{4}-\d{2}-\d{2}T/.test(valor)) {
      try {
        return new Date(valor).toLocaleDateString('es-CO');
      } catch {
        return valor;
      }
    }
    return valor;
  }

  if (campo === 'estadoObligacionId') {
    const found = catalogs.estados.find((e: any) => e.id === valor);
    if (found) return found.nombre;
  }
  if (campo === 'nivelRecuperacionId') {
    const found = catalogs.niveles.find((n: any) => n.id === valor);
    if (found) return found.nombre;
  }
  if (campo === 'juzgadoId') {
    const found = catalogs.juzgados.find((j: any) => j.id === valor);
    if (found) return found.nombre || valor;
  }
  if (campo === 'medidaCautelarId') {
    const found = catalogs.medidas.find((m: any) => m.id === valor);
    if (found) return found.nombre;
  }
  return `${valor.slice(0, 8)}...`;
}

function compileTimeline(obs: any, catalogs: any): string {
  const events: { date: Date; text: string }[] = [];

  // 1. Bitacora (Notas de Gestión)
  if (obs.bitacora) {
    obs.bitacora.forEach((b: any) => {
      events.push({
        date: new Date(b.createdAt),
        text: `- [${new Date(b.createdAt).toLocaleDateString('es-CO')}] NOTA DE GESTIÓN: "${b.observacion}"`
      });
    });
  }

  // 2. Recaudos (Abonos)
  if (obs.recaudos) {
    obs.recaudos.forEach((r: any) => {
      const obsText = r.observacion ? ` (Detalle: "${r.observacion}")` : '';
      events.push({
        date: new Date(r.fechaAbonada),
        text: `- [${new Date(r.fechaAbonada).toLocaleDateString('es-CO')}] ABONO REGISTRADO: +$${Number(r.monto).toLocaleString('es-CO')}${obsText}`
      });
    });
  }

  // 3. Notificaciones Procesales
  if (obs.notificaciones) {
    obs.notificaciones.forEach((n: any) => {
      const dest = n.destinatarioPersona?.nombreCompleto || 'N/A';
      const obsText = n.observacion ? ` (Detalle: "${n.observacion}")` : '';
      events.push({
        date: new Date(n.fechaNotificacion),
        text: `- [${new Date(n.fechaNotificacion).toLocaleDateString('es-CO')}] NOTIFICACIÓN PROCESAL enviada a ${dest}${obsText}`
      });
    });
  }

  // 4. Cambios de Estado (HistorialEstadoObligacion)
  if (obs.historialEstados) {
    obs.historialEstados.forEach((e: any) => {
      const ant = e.estadoAnterior?.nombre || 'N/A';
      const nvo = e.estadoNuevo?.nombre || 'N/A';
      const nivText = e.nivelRecuperacionNuevo
        ? ` (Nivel: ${e.nivelRecuperacionAnterior?.nombre || 'N/A'} -> ${e.nivelRecuperacionNuevo?.nombre})`
        : '';
      events.push({
        date: new Date(e.fechaCambio),
        text: `- [${new Date(e.fechaCambio).toLocaleDateString('es-CO')}] CAMBIO DE ESTADO: ${ant} -> ${nvo}${nivText}`
      });
    });
  }

  // 5. Auditorias de Campos
  if (obs.auditoria) {
    obs.auditoria.forEach((a: any) => {
      const label = FIELD_LABELS[a.campoModificado] || a.campoModificado;
      const ant = resolveValue(a.campoModificado, a.valorAnterior, catalogs);
      const nvo = resolveValue(a.campoModificado, a.valorNuevo, catalogs);
      events.push({
        date: new Date(a.fechaCambio),
        text: `- [${new Date(a.fechaCambio).toLocaleDateString('es-CO')}] CAMBIO EN ${label.toUpperCase()}: ${ant} -> ${nvo}`
      });
    });
  }

  // Sort ascending chronological
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return events.map(e => e.text).join('\n\n');
}

function getTimelineEvents(obs: any, catalogs: any): any[] {
  const events: { date: Date; dateStr: string; title: string; text: string; color: string }[] = [];

  // 1. Bitacora (Notas de Gestión)
  if (obs.bitacora) {
    obs.bitacora.forEach((b: any) => {
      events.push({
        date: new Date(b.createdAt),
        dateStr: new Date(b.createdAt).toLocaleDateString('es-CO'),
        title: 'NOTA DE GESTIÓN',
        text: `"${b.observacion}"`,
        color: '#f97316' // Orange
      });
    });
  }

  // 2. Recaudos (Abonos)
  if (obs.recaudos) {
    obs.recaudos.forEach((r: any) => {
      const obsText = r.observacion ? `Detalle: "${r.observacion}"` : 'Abono registrado correctamente';
      events.push({
        date: new Date(r.fechaAbonada),
        dateStr: new Date(r.fechaAbonada).toLocaleDateString('es-CO'),
        title: `ABONO REGISTRADO: +$${Number(r.monto).toLocaleString('es-CO')}`,
        text: obsText,
        color: '#22c55e' // Green
      });
    });
  }

  // 3. Notificaciones Procesales
  if (obs.notificaciones) {
    obs.notificaciones.forEach((n: any) => {
      const dest = n.destinatarioPersona?.nombreCompleto || 'N/A';
      const obsText = n.observacion ? ` (Detalle: "${n.observacion}")` : '';
      events.push({
        date: new Date(n.fechaNotificacion),
        dateStr: new Date(n.fechaNotificacion).toLocaleDateString('es-CO'),
        title: 'NOTIFICACIÓN PROCESAL',
        text: `Enviada a ${dest}${obsText}`,
        color: '#eab308' // Yellow
      });
    });
  }

  // 4. Cambios de Estado (HistorialEstadoObligacion)
  if (obs.historialEstados) {
    obs.historialEstados.forEach((e: any) => {
      const ant = e.estadoAnterior?.nombre || 'N/A';
      const nvo = e.estadoNuevo?.nombre || 'N/A';
      const nivText = e.nivelRecuperacionNuevo
        ? ` (Nivel: ${e.nivelRecuperacionAnterior?.nombre || 'N/A'} -> ${e.nivelRecuperacionNuevo?.nombre})`
        : '';
      events.push({
        date: new Date(e.fechaCambio),
        dateStr: new Date(e.fechaCambio).toLocaleDateString('es-CO'),
        title: 'CAMBIO DE ESTADO',
        text: `${ant} -> ${nvo}${nivText}`,
        color: '#3b82f6' // Blue
      });
    });
  }

  // 5. Auditorias de Campos (Cambio de medida cautelar, etc.)
  if (obs.auditoria) {
    obs.auditoria.forEach((a: any) => {
      const label = FIELD_LABELS[a.campoModificado] || a.campoModificado;
      const ant = resolveValue(a.campoModificado, a.valorAnterior, catalogs);
      const nvo = resolveValue(a.campoModificado, a.valorNuevo, catalogs);
      events.push({
        date: new Date(a.fechaCambio),
        dateStr: new Date(a.fechaCambio).toLocaleDateString('es-CO'),
        title: `CAMBIO DE ${label.toUpperCase()}`,
        text: `${ant} -> ${nvo}`,
        color: '#ef4444' // Red
      });
    });
  }

  // Sort descending chronological (newest first, as requested in mockup timeline)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return events;
}

export async function reportsRoutes(fastify: FastifyInstance) {
  // ── RUTAS PÚBLICAS ───────────────────────────────────────────

  /**
   * GET /api/reports/public/:token
   * Consulta pública del reporte mediante el token compartido sin autenticación
   */
  fastify.get('/public/:token', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const link = await prisma.reportLink.findUnique({
        where: { token, isActive: true },
        include: {
          reportSnapshot: {
            include: {
              cartera: true,
              cliente: true,
            },
          },
        },
      });

      if (!link) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'El enlace de reporte no existe o fue desactivado.'));
      }

      if (link.expiresAt && link.expiresAt < new Date()) {
        return reply.status(410).send(errorResponse('EXPIRED', 'El enlace ha expirado.'));
      }

      // Incrementar visitas
      await prisma.reportLink.update({
        where: { id: link.id },
        data: { viewCount: { increment: 1 } },
      });

      const snap = link.reportSnapshot;
      const { obligations } = await getPortfolioReportData(
        snap.clienteId,
        snap.carteraId || '',
        snap.periodStart.toISOString().split('T')[0],
        snap.periodEnd.toISOString().split('T')[0]
      );

      // Cargar catálogos para compilar el historial
      const [estados, niveles, medidas, juzgados] = await Promise.all([
        prisma.estadoObligacion.findMany(),
        prisma.nivelRecuperacion.findMany(),
        prisma.medidaCautelar.findMany(),
        prisma.juzgado.findMany({ where: { clienteId: snap.clienteId } })
      ]);
      const catalogs = { estados, niveles, medidas, juzgados };

      const decoratedObligations = obligations.map(obs => ({
        ...obs,
        historialTimeline: compileTimeline(obs, catalogs),
        timelineEvents: getTimelineEvents(obs, catalogs)
      }));

      return reply.send(
        successResponse({
          title: snap.title,
          portfolioName: snap.cartera?.nombreEntidad || 'N/A',
          nit: snap.cartera?.nit || '',
          clientName: snap.cliente.nombreComercial,
          startDate: snap.periodStart.toISOString().split('T')[0],
          endDate: snap.periodEnd.toISOString().split('T')[0],
          obligations: decoratedObligations,
        })
      );
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', error.message || 'Error al obtener el reporte público'));
    }
  });

  /**
   * GET /api/reports/public/:token/pdf
   * Descarga el PDF del reporte compartido usando el token, sin autenticación.
   * Respeta exactamente las fechas (periodStart / periodEnd) guardadas en el snapshot.
   */
  fastify.get('/public/:token/pdf', async (request, reply) => {
    try {
      const { token } = request.params as { token: string };

      const link = await prisma.reportLink.findUnique({
        where: { token, isActive: true },
        include: {
          reportSnapshot: {
            include: {
              cartera: true,
              cliente: true,
            },
          },
        },
      });

      if (!link) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'El enlace de reporte no existe o fue desactivado.'));
      }

      if (link.expiresAt && link.expiresAt < new Date()) {
        return reply.status(410).send(errorResponse('EXPIRED', 'El enlace ha expirado.'));
      }

      const snap = link.reportSnapshot;
      const startDateStr = snap.periodStart.toISOString().split('T')[0];
      const endDateStr   = snap.periodEnd.toISOString().split('T')[0];

      const { obligations } = await getPortfolioReportData(
        snap.clienteId,
        snap.carteraId || '',
        startDateStr,
        endDateStr
      );

      // Nombre de la casa de cobranza
      const agencyName    = snap.cliente.nombreComercial;
      const portfolioName = snap.cartera?.nombreEntidad || 'N/A';
      const nit           = snap.cartera?.nit || '';
      const title         = snap.title;

      // Catálogos para compilar el historial
      const [estados, niveles, medidas, juzgados] = await Promise.all([
        prisma.estadoObligacion.findMany(),
        prisma.nivelRecuperacion.findMany(),
        prisma.medidaCautelar.findMany(),
        prisma.juzgado.findMany({ where: { clienteId: snap.clienteId } }),
      ]);
      const catalogs = { estados, niveles, medidas, juzgados };

      const decoratedObligations = obligations.map(obs => ({
        ...obs,
        historialTimeline: compileTimeline(obs, catalogs),
        timelineEvents:    getTimelineEvents(obs, catalogs),
      }));

      const dateRangeStr = `${startDateStr} al ${endDateStr}`;
      const buffer = await buildPdfReport(
        title,
        portfolioName,
        nit,
        dateRangeStr,
        decoratedObligations,
        agencyName
      );

      reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename=reporte_${token}.pdf`)
        .send(buffer);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al generar el PDF del reporte compartido'));
    }
  });

  // ── RUTAS PROTEGIDAS (Requieren autenticación) ────────────────

  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('onRequest', authenticate);

    /**
     * GET /api/reports/portfolios/:portfolioId/excel
     * Descarga el reporte consolidado en Excel
     */
    protectedRoutes.get('/portfolios/:portfolioId/excel', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) {
          return reply.status(403).send(errorResponse('FORBIDDEN', 'No autorizado'));
        }

        const { portfolioId } = request.params as { portfolioId: string };
        const queryResult = reportQuerySchema.safeParse(request.query);
        if (!queryResult.success) {
          return reply.status(422).send(errorResponse('VALIDATION_ERROR', queryResult.error.issues[0]?.message || 'Parámetros inválidos'));
        }

        const now = new Date();
        const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const defaultEnd = now.toISOString().split('T')[0];

        const startDate = queryResult.data.startDate || defaultStart;
        const endDate = queryResult.data.endDate || defaultEnd;
        const title = queryResult.data.title || 'Reporte de Seguimiento';

        const { portfolio, obligations } = await getPortfolioReportData(
          user.clienteId,
          portfolioId,
          startDate,
          endDate
        );

        // Cargar catálogos para compilar el historial
        const [estados, niveles, medidas, juzgados] = await Promise.all([
          prisma.estadoObligacion.findMany(),
          prisma.nivelRecuperacion.findMany(),
          prisma.medidaCautelar.findMany(),
          prisma.juzgado.findMany({ where: { clienteId: user.clienteId } })
        ]);
        const catalogs = { estados, niveles, medidas, juzgados };

        const decoratedObligations = obligations.map(obs => ({
          ...obs,
          historialTimeline: compileTimeline(obs, catalogs),
          timelineEvents: getTimelineEvents(obs, catalogs)
        }));

        const dateRangeStr = `${startDate} al ${endDate}`;
        const buffer = await buildExcelReport(
          title,
          portfolio.nombreEntidad,
          portfolio.nit || '',
          dateRangeStr,
          decoratedObligations,
          startDate,
          endDate
        );

        reply
          .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
          .header('Content-Disposition', `attachment; filename=reporte_cartera_${portfolioId}.xlsx`)
          .send(buffer);
      } catch (error: any) {
        request.log.error(error);
        if (error.message === 'Cartera no encontrada') {
          return reply.status(404).send(errorResponse('NOT_FOUND', error.message));
        }
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al generar el reporte Excel'));
      }
    });

    /**
     * GET /api/reports/portfolios/:portfolioId/pdf
     * Descarga el reporte consolidado en PDF
     */
    protectedRoutes.get('/portfolios/:portfolioId/pdf', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) {
          return reply.status(403).send(errorResponse('FORBIDDEN', 'No autorizado'));
        }

        const { portfolioId } = request.params as { portfolioId: string };
        const queryResult = reportQuerySchema.safeParse(request.query);
        if (!queryResult.success) {
          return reply.status(422).send(errorResponse('VALIDATION_ERROR', queryResult.error.issues[0]?.message || 'Parámetros inválidos'));
        }

        const now = new Date();
        const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const defaultEnd = now.toISOString().split('T')[0];

        const startDate = queryResult.data.startDate || defaultStart;
        const endDate = queryResult.data.endDate || defaultEnd;
        const title = queryResult.data.title || 'Reporte de Seguimiento';

        const { portfolio, obligations } = await getPortfolioReportData(
          user.clienteId,
          portfolioId,
          startDate,
          endDate
        );

        // Obtener nombre de la casa de cobranza (agencia)
        const agencyRecord = await prisma.cliente.findUnique({
          where: { id: user.clienteId },
          select: { nombreComercial: true },
        });
        const agencyName = agencyRecord?.nombreComercial || 'Casa de Cobranza';

        // Cargar catálogos para compilar el historial
        const [estados, niveles, medidas, juzgados] = await Promise.all([
          prisma.estadoObligacion.findMany(),
          prisma.nivelRecuperacion.findMany(),
          prisma.medidaCautelar.findMany(),
          prisma.juzgado.findMany({ where: { clienteId: user.clienteId } })
        ]);
        const catalogs = { estados, niveles, medidas, juzgados };

        const decoratedObligations = obligations.map(obs => ({
          ...obs,
          historialTimeline: compileTimeline(obs, catalogs),
          timelineEvents: getTimelineEvents(obs, catalogs)
        }));

        const dateRangeStr = `${startDate} al ${endDate}`;
        const buffer = await buildPdfReport(title, portfolio.nombreEntidad, portfolio.nit || '', dateRangeStr, decoratedObligations, agencyName);

        reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename=reporte_cartera_${portfolioId}.pdf`)
          .send(buffer);
      } catch (error: any) {
        request.log.error(error);
        if (error.message === 'Cartera no encontrada') {
          return reply.status(404).send(errorResponse('NOT_FOUND', error.message));
        }
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al generar el reporte PDF'));
      }
    });

    /**
     * POST /api/reports/portfolios/:portfolioId/link
     * Genera un enlace compartido público para la cartera
     */
    protectedRoutes.post('/portfolios/:portfolioId/link', async (request, reply) => {
      try {
        const user = request.currentUser;
        if (!user || !user.clienteId) {
          return reply.status(403).send(errorResponse('FORBIDDEN', 'No autorizado'));
        }

        const { portfolioId } = request.params as { portfolioId: string };
        const bodyResult = reportLinkBodySchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.status(422).send(errorResponse('VALIDATION_ERROR', bodyResult.error.issues[0]?.message || 'Datos inválidos'));
        }

        const { startDate, endDate, title, expiresInDays } = bodyResult.data;

        // Validar que la cartera exista y pertenezca al cliente
        const portfolio = await prisma.cartera.findFirst({
          where: { id: portfolioId, clienteId: user.clienteId }
        });

        if (!portfolio) {
          return reply.status(404).send(errorResponse('NOT_FOUND', 'Cartera no encontrada'));
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const snapshot = await prisma.reportSnapshot.create({
          data: {
            clienteId: user.clienteId,
            carteraId: portfolioId,
            title: title || 'Reporte Compartido',
            periodStart: new Date(startDate),
            periodEnd: new Date(endDate),
            params: { portfolioId, startDate, endDate },
            createdById: user.userId,
          }
        });

        const token = nanoid(16);

        const link = await prisma.reportLink.create({
          data: {
            clienteId: user.clienteId,
            reportSnapshotId: snapshot.id,
            token,
            expiresAt,
            createdById: user.userId,
          }
        });

        return reply.send(successResponse({ token, expiresAt: link.expiresAt }));
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Error al generar el enlace compartido'));
      }
    });
  });
}
