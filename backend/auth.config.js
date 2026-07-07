import Credentials from '@auth/express/providers/credentials';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

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
          console.log('[Auth] authorize() called with email:', credentials?.email ? String(credentials.email) : '<missing>');
          if (!credentials?.email || !credentials?.password) {
            console.log('[Auth] Missing email or password in credentials');
            return null;
          }

          // Find user by email
          const email = String(credentials.email).toLowerCase();
          const user = await User.findOne({ email });
          console.log('[Auth] User lookup result for', email, ':', !!user);
          if (!user) {
            console.log('[Auth] No user found for email:', email);
            return null;
          }

          console.log('[Auth] Stored password present?', !!user.password);
          if (!user.password) {
            console.log('[Auth] User has no stored password (maybe OAuth-only)');
            return null;
          }

          // Compare password
          const isValid = await bcrypt.compare(String(credentials.password), user.password);
          console.log('[Auth] bcrypt.compare result for', email, ':', isValid);
          if (!isValid) {
            console.log('[Auth] Incorrect password for', email);
            return null;
          }

          const result = {
            id: user._id.toString(),
            name: user.username,
            email: user.email,
            image: user.avatar_url
          };
          console.log('[Auth] authorize() returning user:', result.id);
          return result;
        } catch (err) {
          console.error('[Auth] authorize() error:', err);
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true
};
