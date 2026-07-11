import { NextAuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/utils/db";
import bcrypt from "bcryptjs";

interface ExtendedUser extends User {
  id: string;
}

interface ExtendedJWT extends JWT {
  id: string;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password)
          throw new Error("Email and password are required");

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
          },
        });

        if (!user || !user.password)
          throw new Error("No account found — try signing in with Google");

        const match = await bcrypt.compare(credentials.password, user.password);
        if (!match) throw new Error("Incorrect password");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    // Only the Google branch needs to upsert -- Credentials users already
    // exist by the time authorize() succeeds (accounts are created via a
    // separate sign-up action, not here).
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const dbUser = await db.user.upsert({
          where: { email: user.email! },
          update: { name: user.name },
          create: {
            email: user.email!,
            name: user.name,
          },
          select: { id: true },
        });

        const ext = user as ExtendedUser;
        ext.id = dbUser.id;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      const extToken = token as ExtendedJWT;

      if (account && user) {
        const extUser = user as ExtendedUser;
        extToken.id = extUser.id ?? token.sub ?? "";
      }

      return extToken;
    },

    async session({ session, token }) {
      const extToken = token as ExtendedJWT;
      if (extToken && session.user) {
        session.user.id = extToken.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
