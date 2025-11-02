import { Schema, model, Document, Types } from 'mongoose';

export interface ScoreRecordDocument extends Document {
  userId: Types.ObjectId;
  gameKey: string;
  score: number;
  level?: number;
  durationMs: number;
  mode: 'single' | 'multi';
  matchId?: Types.ObjectId;
  createdAt: Date;
}

const scoreRecordSchema = new Schema<ScoreRecordDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameKey: { type: String, required: true },
    score: { type: Number, required: true },
    level: Number,
    durationMs: { type: Number, required: true },
    mode: { type: String, enum: ['single', 'multi'], required: true },
    matchId: { type: Schema.Types.ObjectId, ref: 'MatchSession' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

scoreRecordSchema.index({ userId: 1, gameKey: 1 });
scoreRecordSchema.index({ gameKey: 1, score: -1 });

export const ScoreRecordModel = model<ScoreRecordDocument>('ScoreRecord', scoreRecordSchema);
