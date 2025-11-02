import { Schema, model, Document, Types } from 'mongoose';

export interface RefreshTokenDocument extends Document {
  tokenHash: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  replacedBy?: string;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    replacedBy: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

refreshTokenSchema.index({ userId: 1, expiresAt: 1 });

export const RefreshTokenModel = model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema);
