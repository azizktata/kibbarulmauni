import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser, getUserByEmail } from "@/db/queries";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        try {
          await upsertUser(user.email, user.name ?? null);
        } catch (err) {
          console.error("[auth signIn] upsertUser failed:", err);
          // Allow sign-in to proceed even if DB write fails
        }
      }
      return true;
    },
    async jwt({ token, trigger }) {
      if ((trigger === "signIn" || !token.userId) && token.email) {
        try {
          const dbUser = await getUserByEmail(token.email);
          token.userId = dbUser?.id;
        } catch (err) {
          console.error("[auth jwt] getUserByEmail failed:", err);
          // Leave token.userId undefined; API routes will treat user as unauthenticated
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
