import NextAuth from "next-auth"
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      firstName?: string | null
      lastName?: string | null
      image?: string | null
      permissions?: {
        view_members?: boolean;
        view_transactions?: boolean;
        view_reports?: boolean;
        view_stats?: boolean;
        view_dues?: boolean;
        view_events?: boolean;
        manage_categories?: boolean;
        manage_settings?: boolean;
      }
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    role?: string
    firstName?: string | null
    lastName?: string | null
    image?: string | null
    permissions?: any
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
    firstName?: string | null
    lastName?: string | null
    image?: string | null
    permissions?: any
  }
}
