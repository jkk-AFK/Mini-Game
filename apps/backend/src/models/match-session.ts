import { Schema, model, Document, Types } from 'mongoose';

export interface MatchPlayer {
  userId: Types.ObjectId;
  team: number;
}

export interface MatchSessionDocument extends Document {
  gameKey: string;
  status: 'waiting' | 'active' | 'finished';
  players: MatchPlayer[];
  snapshot?: string;
  createdAt: Date;
  updatedAt: Date;
}

const matchPlayerSchema = new Schema<MatchPlayer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: Number, default: 0 },
  },
  { _id: false },
);

const matchSessionSchema = new Schema<MatchSessionDocument>(
  {
    gameKey: { type: String, required: true },
    status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
    players: { type: [matchPlayerSchema], default: [] },
    snapshot: String,
  },
  { timestamps: true },
);

matchSessionSchema.index({ gameKey: 1, status: 1 });

export const MatchSessionModel = model<MatchSessionDocument>('MatchSession', matchSessionSchema);
