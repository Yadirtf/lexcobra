// ═══════════════════════════════════════════════════════════════
//  LexCobra — Entidad: Empleado (Schema Oficial)
// ═══════════════════════════════════════════════════════════════

export class Empleado {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly usuarioId: string | null,
    public readonly identificacion: string,
    public readonly nombres: string,
    public readonly apellidos: string,
    public readonly telefono: string | null,
    public readonly cargoId: string | null,
    public readonly activo: boolean,
    public readonly createdAt: Date,
    public readonly cargo?: { id: string; nombreCargo: string } | null,
  ) {}

  /** Nombre completo concatenado */
  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`;
  }

  public static create(data: any): Empleado {
    return new Empleado(
      data.id,
      data.clienteId,
      data.usuarioId,
      data.identificacion,
      data.nombres,
      data.apellidos,
      data.telefono,
      data.cargoId,
      data.activo,
      data.createdAt,
      data.cargo,
    );
  }
}
