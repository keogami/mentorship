import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/subscribe",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.provider = token.provider as string
        session.user.providerAccountId = token.providerAccountId as string
      }
      return session
    },
  },
})
