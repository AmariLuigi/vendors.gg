import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accountType: string;
    isVerified: boolean | null;
    avatar: string | null | undefined;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      accountType: string;
      isVerified: boolean | null;
      avatar: string | null | undefined;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accountType: string;
    isVerified: boolean | null;
    avatar: string | null | undefined;
    lastUpdated?: number;
  }
}