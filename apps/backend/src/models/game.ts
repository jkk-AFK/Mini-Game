import { Schema, model, Document } from 'mongoose';

export interface GameDocument extends Document {
  key: string;
  name: string;
  genre: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const gameSchema = new Schema<GameDocument>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    genre: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const GameModel = model<GameDocument>('Game', gameSchema);
