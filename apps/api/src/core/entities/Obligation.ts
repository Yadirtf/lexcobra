// ═══════════════════════════════════════════════════════════════
//  LexCobra — Entidad: Obligación (Schema Oficial)
// ═══════════════════════════════════════════════════════════════

export class Obligation {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly carteraId: string | null,
    public readonly numeroCredito: string,
    public readonly numeroPagare: string | null,
    public readonly saldoCapitalDemandado: number,
    public readonly departamentoId: string | null,
    public readonly municipioId: string | null,
    public readonly fechaReparto: Date | null,
    public readonly fechaPresentacionDemanda: Date | null,
    public readonly juzgadoId: string | null,
    public readonly radicado: string | null,
    public readonly medidaCautelarId: string | null,
    public readonly mandamientoPagoFecha: Date | null,
    public readonly autoSeguirEjecucionFecha: Date | null,
    public readonly liquidacionCreditoAprobadaFecha: Date | null,
    public readonly estadoObligacionId: string | null,
    public readonly nivelRecuperacionId: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly actores?: {
      persona: {
        id: string;
        numeroIdentificacion: string;
        nombreCompleto: string;
      };
      rolActor?: {
        id: string;
        nombreRol: string;
      } | null;
    }[],
    public readonly estadoObligacion?: { nombre: string; color: string | null } | null,
    public readonly juzgado?: { nombre: string } | null,
    public readonly municipio?: { nombre: string } | null,
    public readonly medidaCautelar?: { nombre: string } | null,
    public readonly nivelRecuperacion?: { nombre: string; color: string | null } | null,
  ) {}

  public static create(data: any): Obligation {
    return new Obligation(
      data.id,
      data.clienteId,
      data.carteraId,
      data.numeroCredito,
      data.numeroPagare,
      Number(data.saldoCapitalDemandado),
      data.departamentoId,
      data.municipioId,
      data.fechaReparto,
      data.fechaPresentacionDemanda,
      data.juzgadoId,
      data.radicado,
      data.medidaCautelarId,
      data.mandamientoPagoFecha,
      data.autoSeguirEjecucionFecha,
      data.liquidacionCreditoAprobadaFecha,
      data.estadoObligacionId,
      data.nivelRecuperacionId,
      data.isActive,
      data.createdAt,
      data.updatedAt,
      data.actores,
      data.estadoObligacion,
      data.juzgado,
      data.municipio,
      data.medidaCautelar,
      data.nivelRecuperacion,
    );
  }
}
