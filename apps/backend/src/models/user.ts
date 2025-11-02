import { Schema, model, Document } from 'mongoose';

export interface OAuthProvider {
  type: 'email' | 'google' | 'facebook';
  providerId: string;
}

export interface UserDocument extends Document {
  username: string;
  email: string;
  passwordHash: string;
  providers: OAuthProvider[];
  roles: string[];
  locale: string;
  createdAt: Date;
  updatedAt: Date;
  bannedUntil?: Date;
}

const providerSchema = new Schema<OAuthProvider>({
  type: { type: String, enum: ['email', 'google', 'facebook'], required: true },
  providerId: { type: String, required: true },
});

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    providers: { type: [providerSchema], default: [] },
    roles: { type: [String], default: ['user'] },
    locale: { type: String, default: 'en' },
    bannedUntil: Date,
  },
  { timestamps: true },
);

export const UserModel = model<UserDocument>('User', userSchema);
