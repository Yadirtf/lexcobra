import { PrismaClient } from '@prisma/client';
import { IPortfolioRepository, CreatePortfolioDTO, UpdatePortfolioDTO } from '../../core/repositories/IPortfolioRepository.js';
import { Portfolio } from '../../core/entities/Portfolio.js';

export class PrismaPortfolioRepository implements IPortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(clienteId: string, id: string): Promise<Portfolio | null> {
    const cartera = await this.prisma.cartera.findFirst({
      where: {
        id,
        clienteId,
      },
      include: {
        _count: {
          select: { obligaciones: true },
        },
      },
    });

    if (!cartera) return null;
    return Portfolio.create(cartera);
  }

  async findAll(clienteId: string): Promise<Portfolio[]> {
    const carteras = await this.prisma.cartera.findMany({
      where: { clienteId },
      include: {
        _count: {
          select: { obligaciones: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return carteras.map((c) => Portfolio.create(c));
  }

  async create(data: CreatePortfolioDTO): Promise<Portfolio> {
    const cartera = await this.prisma.cartera.create({
      data: {
        clienteId: data.clienteId,
        nombreEntidad: data.nombreEntidad,
        nit: data.nit,
        representante: data.representante,
        telefono: data.telefono,
        correo: data.correo,
        observaciones: data.observaciones,
        logoUrl: data.logoUrl,
      },
    });

    return Portfolio.create(cartera);
  }

  async update(clienteId: string, id: string, data: UpdatePortfolioDTO): Promise<Portfolio> {
    const cartera = await this.prisma.cartera.update({
      where: {
        id,
        clienteId,
      },
      data,
    });

    return Portfolio.create(cartera);
  }

  async delete(clienteId: string, id: string): Promise<void> {
    await this.prisma.cartera.update({
      where: {
        id,
        clienteId,
      },
      data: {
        activo: false, // Soft delete
      },
    });
  }
}
