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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // Find user by email
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user || !user.password) {
          return null;
        }

        // Compare password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          image: user.avatar_url
        };
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
