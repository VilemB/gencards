import "dotenv/config";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { AuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import mongoose from "mongoose";

interface UserData {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

export async function getUserById(userId: string): Promise<UserData | null> {
  try {
    await connectToDatabase();
    const user = await mongoose.connection
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(userId) });

    if (!user) return null;

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectToDatabase();

        // Find user and explicitly select password field
        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await user.comparePassword(
          credentials.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectToDatabase();

        // Check if user exists by email
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          // Create new user from Google data
          dbUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: new Date(),
          });
        }

        // Update the user object with MongoDB _id
        user.id = dbUser._id.toString();
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        // Use the token's sub (which contains MongoDB _id) for the session user id
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Store MongoDB _id in the token's sub field
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
