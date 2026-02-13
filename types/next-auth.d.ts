import NextAuth from "next-auth"
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      role?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}
