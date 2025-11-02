import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { upsertOAuthUser } from '../services/oauth-service.js';

let initialized = false;
let googleEnabled = false;
let facebookEnabled = false;

export function configurePassport() {
  if (initialized) {
    return;
  }

  const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL:
            `${process.env.API_BASE_URL ?? ''}/api/v1/auth/google/callback` ||
            '/api/v1/auth/google/callback',
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const displayName = profile.displayName ?? profile.username ?? 'Google User';
            const tokens = await upsertOAuthUser('google', profile.id, email, displayName);
            done(null, { tokens, redirectOrigin: clientOrigin });
          } catch (error) {
            done(error as Error);
          }
        },
      ),
    );
    googleEnabled = true;
  }

  const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
  const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  if (facebookClientId && facebookClientSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: facebookClientId,
          clientSecret: facebookClientSecret,
          callbackURL:
            `${process.env.API_BASE_URL ?? ''}/api/v1/auth/facebook/callback` ||
            '/api/v1/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'emails'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const displayName = profile.displayName ?? profile.username ?? 'Facebook User';
            const tokens = await upsertOAuthUser('facebook', profile.id, email, displayName);
            done(null, { tokens, redirectOrigin: clientOrigin });
          } catch (error) {
            done(error as Error);
          }
        },
      ),
    );
    facebookEnabled = true;
  }

  initialized = true;
}

export function isGoogleOAuthEnabled() {
  return googleEnabled;
}

export function isFacebookOAuthEnabled() {
  return facebookEnabled;
}
