import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs"; // Use bcryptjs

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Auth: Faltan credenciales");
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.log("Auth: Usuario no encontrado:", credentials.email);
            return null
          }

          if (!user.password) {
            console.log("Auth: El usuario no tiene contraseña definida");
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log("Auth: Contraseña incorrecta para:", credentials.email);
            return null
          }

          console.log("Auth: Login exitoso para:", credentials.email);
          return {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth: Error en el proceso de autorización:", error);
          throw new Error("Error en el servidor durante la autenticación");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
