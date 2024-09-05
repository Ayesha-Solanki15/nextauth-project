import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "@auth/core/jwt";

export type ExtendedUser = DefaultSession["user"] & {
  id: string;
  role: "ADMIN" | "USER";
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}
declare module "@auth/core/jwt" {
  interface JWT {
    role?: "ADMIN" | "USER";
  }
}
