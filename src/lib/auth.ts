import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import DiscordProvider from 'next-auth/providers/discord';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { accounts, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await db
            .select()
            .from(accounts)
            .where(eq(accounts.email, credentials.email))
            .limit(1);

          if (user.length === 0) {
            return null;
          }

          const account = user[0];

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            account.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user object
          return {
            id: account.id,
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
            accountType: account.accountType,
            isVerified: account.isVerified,
            avatar: account.avatar,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // If this is a new login, set the user data
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.accountType = user.accountType;
        token.isVerified = user.isVerified;
        token.avatar = user.avatar;
      }
      
      // If this is an update trigger or the token is older than 1 hour, refresh user data
      if (trigger === 'update' || (token.id && (!token.lastUpdated || Date.now() - token.lastUpdated > 60 * 60 * 1000))) {
        try {
          const userRecord = await db.select({
            id: accounts.id,
            firstName: accounts.firstName,
            lastName: accounts.lastName,
            accountType: accounts.accountType,
            isVerified: accounts.isVerified,
            avatar: accounts.avatar,
          }).from(accounts).where(eq(accounts.id, token.id as string)).limit(1);
          
          if (userRecord.length > 0) {
            const user = userRecord[0];
            token.firstName = user.firstName;
            token.lastName = user.lastName;
            token.accountType = user.accountType;
            token.isVerified = user.isVerified;
            token.avatar = user.avatar;
            token.lastUpdated = Date.now();
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.accountType = token.accountType as string;
        session.user.isVerified = token.isVerified as boolean | null;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};