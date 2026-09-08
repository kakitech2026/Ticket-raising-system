import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { allowAttempt } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [CredentialsProvider({
    name: "Credentials",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password || credentials.password.length > 72) return null;
      const email = credentials.email.trim().toLowerCase();
      if (!await allowAttempt("login:" + email, 10)) throw new Error("Too many attempts. Try again in 15 minutes.");
      const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, isActive: true } });
      // Use a valid fixed hash when the account does not exist to avoid a fast failure path.
      const valid = await bcrypt.compare(credentials.password, user?.password || "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
      if (!user || !valid) return null;
      return { id: user.id, email: user.email, name: user.name, role: user.role, sessionVersion: user.sessionVersion };
    },
  })],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.sessionVersion = user.sessionVersion; }
      if (!token.id || token.sessionVersion === undefined) return { ...token, invalid: true };
      const current = await prisma.user.findUnique({ where: { id: token.id }, select: { id: true, isActive: true, sessionVersion: true, role: true, name: true, email: true } });
      if (!current?.isActive || current.sessionVersion !== token.sessionVersion) return { ...token, invalid: true };
      return { ...token, role: current.role, name: current.name, email: current.email, invalid: false };
    },
    async session({ session, token }) {
      if (token.invalid) { session.user = undefined as never; return session; }
      session.user = { ...session.user, id: token.id, role: token.role, name: token.name, email: token.email };
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
