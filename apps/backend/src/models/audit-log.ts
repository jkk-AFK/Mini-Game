import { Schema, model, Document, Types } from 'mongoose';

export interface AuditLogDocument extends Document {
  actorId: Types.ObjectId;
  action: string;
  target?: Types.ObjectId;
  payload: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    target: { type: Schema.Types.ObjectId },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

auditLogSchema.index({ action: 1 });

export const AuditLogModel = model<AuditLogDocument>('AuditLog', auditLogSchema);
