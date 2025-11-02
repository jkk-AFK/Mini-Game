import { Router } from 'express';
import { z } from 'zod';
import passport from 'passport';
import { loginUser, refreshToken, registerUser, revokeRefreshToken } from '../services/auth-service.js';
import { isFacebookOAuthEnabled, isGoogleOAuthEnabled } from '../config/passport.js';
import { ensureAuthenticated, AuthRequest } from '../middleware/auth.js';

interface OAuthPayload {
  tokens: { accessToken: string; refreshToken: string };
  redirectOrigin: string;
}

function sendOAuthResponse(res: import('express').Response, payload: OAuthPayload) {
  const targetOrigin = payload.redirectOrigin ?? process.env.CLIENT_ORIGIN ?? '*';
  const body = `<!doctype html><html><body><script>
    const payload = ${JSON.stringify({ type: 'oauth', tokens: payload.tokens })};
    if (window.opener) {
      window.opener.postMessage(payload, '${targetOrigin}');
    }
    window.close();
  </script></body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(body);
}

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const tokens = await registerUser(input);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const tokens = await loginUser(input.email, input.password);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const input = refreshSchema.parse(req.body);
    const tokens = await refreshToken(input.refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/logout',
  ensureAuthenticated,
  async (req: AuthRequest, res, next) => {
    try {
      const input = refreshSchema.parse(req.body);
      await revokeRefreshToken(input.refreshToken, req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

if (isGoogleOAuthEnabled()) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
  );
  router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (error, payload: OAuthPayload) => {
      if (error || !payload) {
        return res.status(500).send('OAuth failed');
      }
      return sendOAuthResponse(res, payload);
    })(req, res, next);
  });
}

if (isFacebookOAuthEnabled()) {
  router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
  router.get('/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', { session: false }, (error, payload: OAuthPayload) => {
      if (error || !payload) {
        return res.status(500).send('OAuth failed');
      }
      return sendOAuthResponse(res, payload);
    })(req, res, next);
  });
}
