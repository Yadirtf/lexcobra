// ═══════════════════════════════════════════════════════════════
//  LexCobra — Entidad: Cartera (Schema Oficial)
// ═══════════════════════════════════════════════════════════════

export class Portfolio {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly nombreEntidad: string,
    public readonly nit: string | null,
    public readonly representante: string | null,
    public readonly telefono: string | null,
    public readonly correo: string | null,
    public readonly observaciones: string | null,
    public readonly logoUrl: string | null,
    public readonly activo: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly _count?: {
      obligaciones: number;
    }
  ) {}

  public static create(data: {
    id: string;
    clienteId: string;
    nombreEntidad: string;
    nit: string | null;
    representante: string | null;
    telefono: string | null;
    correo: string | null;
    observaciones: string | null;
    logoUrl: string | null;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { obligaciones: number };
  }): Portfolio {
    return new Portfolio(
      data.id,
      data.clienteId,
      data.nombreEntidad,
      data.nit,
      data.representante,
      data.telefono,
      data.correo,
      data.observaciones,
      data.logoUrl,
      data.activo,
      data.createdAt,
      data.updatedAt,
      data._count
    );
  }
}
