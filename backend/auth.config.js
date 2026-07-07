import Credentials from '@auth/express/providers/credentials';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import { logger } from './utils/logger.js';
import { config } from './utils/config.js';

export const authConfig = {
  basePath: '/api/auth',
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          logger.info('[Auth] authorize() called for email: ' + (credentials?.email ? String(credentials.email) : '<missing>'));
          if (!credentials?.email || !credentials?.password) {
            logger.warn('[Auth] Missing email or password in credentials');
            return null;
          }

          // Find user by email
          const email = String(credentials.email).toLowerCase();
          const user = await User.findOne({ email });
          logger.info(`[Auth] User lookup result for ${email}: ${!!user}`);
          if (!user) {
            logger.warn('[Auth] No user found for email: ' + email);
            return null;
          }

          logger.info(`[Auth] Stored password present? ${!!user.password}`);
          if (!user.password) {
            logger.warn('[Auth] User has no stored password (maybe OAuth-only)');
            return null;
          }

          // Compare password
          const isValid = await bcrypt.compare(String(credentials.password), user.password);
          logger.info(`[Auth] bcrypt.compare result for ${email}: ${isValid}`);
          if (!isValid) {
            logger.warn('[Auth] Incorrect password for: ' + email);
            return null;
          }

          const result = {
            id: user._id.toString(),
            name: user.username,
            email: user.email,
            image: user.avatar_url,
            user_tag: user.user_tag,
            bio: user.bio,
            publicKey: user.publicKey,
            preferences: user.preferences
          };
          logger.info('[Auth] authorize() returning user: ' + result.id);
          return result;
        } catch (err) {
          logger.error('[Auth] authorize() error', err);
          throw err;
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 2 * 60 * 60 // 2 hours stateless lifetime (with sliding refresh on interactions)
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.email = user.email;
        token.avatar_url = user.image;
        token.user_tag = user.user_tag;
        token.bio = user.bio;
        token.publicKey = user.publicKey;
        token.preferences = user.preferences;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          username: token.username,
          email: token.email,
          avatar_url: token.avatar_url,
          user_tag: token.user_tag,
          bio: token.bio,
          publicKey: token.publicKey,
          preferences: token.preferences
        };
      }
      return session;
    }
  },
  secret: config.authSecret,
  trustHost: true
};
