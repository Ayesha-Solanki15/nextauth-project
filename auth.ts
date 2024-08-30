import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getUserById } from "./data/user";
import email from "next-auth/providers/email";
import { db } from "./lib/db";

// declare module "@auth/core" {
//   interface Session {
//     user: {
//       role: "ADMIN" | "USER";
//     } & DefaultSession["user"];
//   }
// }
//moved to next-auth.d.ts

const prisma = new PrismaClient();

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // allow OAuth without email verification
      if (account?.provider !== "credentials") {
        return true;
      }
      const existingUser = await getUserById(user.id);
      // prevent sign in without email verification
      if (!existingUser || !existingUser.emailVerified) {
        return false;
      }
      // TODO: ADD 2FA check
      return true;
    },
    async session({ token, session }) {
      // console.log("Session token", token);
      // console.log("Session", session);
      // return session;
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        // we got the error here saying role doesn't exist on user, for this we need to extend the user object and it is done in next-auth.d.ts
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token }) {
      // console.log("jwt callback", token);
      // output
      // jwt callback {
      //   name: 'Ayesha',
      //   email: 'ayeshasolanki15@gmail.com',
      //   picture: null,
      //   sub: 'cm0arm6nf0000dh5tkooedyaz', this sub is the id we have in our database
      //   iat: 1724735386,
      //   exp: 1727327386,
      //   jti: '772602ae-2b85-4727-b7ac-7765621883ea'
      // }

      // role in not a part of the token, so we need to add it manually
      if (!token.sub) {
        return token;
      }
      const existingUser = await getUserById(token.sub);
      if (!existingUser) {
        return token;
      }
      token.role = existingUser.role;
      return token;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
});
