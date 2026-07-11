import { IObligationRepository } from '../../repositories/IObligationRepository.js';

export class AddBitacoraUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(
    clienteId: string,
    obligacionId: string,
    usuarioId: string,
    observacion: string
  ): Promise<void> {
    if (!observacion || observacion.trim().length === 0) {
      throw new Error("La observación no puede estar vacía");
    }
    
    return this.obligationRepository.addBitacora(
      clienteId,
      obligacionId,
      observacion,
      usuarioId
    );
  }
}
