import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPrisma } from "@/db";

const DUMMY_PASSWORD_HASH =
  "$2b$12$NG4f/RuG1WbjcUUdXu8JxuqVTrhql6F7p3I027m9p4GMY/KGbFOLO";

export const { auth, handlers, signIn, signOut } = NextAuth({
  // AUTH_SECRET is the production name. The fallback supports secrets created
  // by the locally installed auth CLI without exposing either value.
  secret: process.env.BETTER_AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";

        if (
          !email ||
          email.length > 254 ||
          password.length < 8 ||
          password.length > 128
        ) {
          return null;
        }

        const user = await getPrisma().user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
          },
        });

        // Always perform bcrypt work so unknown emails do not return faster.
        const passwordMatches = await compare(
          password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        );

        if (!user || !passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
});
