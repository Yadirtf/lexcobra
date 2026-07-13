import { IObligationRepository } from '../../repositories/IObligationRepository.js';
import { CreateNotificationInput } from '@lexcobra/shared-schemas';

export class AddNotificacionUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(
    clienteId: string,
    obligacionId: string,
    data: CreateNotificationInput
  ): Promise<void> {
    const fecha = new Date(data.fechaNotificacion);
    if (isNaN(fecha.getTime())) {
      throw new Error('Fecha de notificación inválida');
    }

    return this.obligationRepository.addNotificacion(
      clienteId,
      obligacionId,
      {
        destinatarioPersonaId: data.destinatarioPersonaId || null,
        fechaNotificacion: fecha,
        observacion: data.observacion
      }
    );
  }
}
