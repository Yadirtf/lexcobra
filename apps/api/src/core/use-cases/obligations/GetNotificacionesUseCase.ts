import { IObligationRepository, NotificacionItem } from '../../repositories/IObligationRepository.js';

export class GetNotificacionesUseCase {
  constructor(private readonly obligationRepository: IObligationRepository) {}

  async execute(clienteId: string, obligacionId: string): Promise<NotificacionItem[]> {
    return this.obligationRepository.getNotificaciones(clienteId, obligacionId);
  }
}
