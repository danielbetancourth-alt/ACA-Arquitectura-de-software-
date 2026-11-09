import { EventEmitter } from 'events';
import { db, hashString } from '../db/database';

export interface AuditEventData {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ENROLL' | 'GRADE_MUTATION' | 'LOGIN' | 'STRESS_TEST';
  entity: string;
  entityId: string;
  beforeState: any;
  afterState: any;
  ipAddress?: string;
}

class AuditEventBus extends EventEmitter {
  constructor() {
    super();
    // Decoupled listener for audit logging (RF-12, RNF-10)
    this.on('AUDIT_MUTATION', (event: AuditEventData) => {
      try {
        db.recordAudit({
          actorId: event.actorId,
          actorEmail: event.actorEmail,
          actorRole: event.actorRole,
          action: event.action,
          entity: event.entity,
          entityId: event.entityId,
          beforeState: event.beforeState ? JSON.stringify(event.beforeState) : null,
          afterState: event.afterState ? JSON.stringify(event.afterState) : null,
          ipAddress: event.ipAddress || '127.0.0.1',
        });
      } catch (err) {
        console.error('[AUDIT_ERROR] Error al registrar evento inmutable:', err);
      }
    });
  }

  dispatch(event: AuditEventData) {
    this.emit('AUDIT_MUTATION', event);
  }
}

export const auditBus = new AuditEventBus();
