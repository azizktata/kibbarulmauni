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
        await upsertUser(user.email, user.name ?? null);
      }
      return true;
    },
    async jwt({ token, trigger }) {
      if ((trigger === "signIn" || !token.userId) && token.email) {
        const dbUser = await getUserByEmail(token.email);
        token.userId = dbUser?.id;
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
