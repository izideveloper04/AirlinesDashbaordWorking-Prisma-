// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/pages';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
    interface Session {
        user: {
            id:    string;
            name:  string;
            email: string;
            role:  string;
        };
    }
    interface User {
        id:   string;
        role: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id:   string;
        role: string;
    }
}

export const authOptions: NextAuthOptions = {
    // Store session as encrypted JWT in httpOnly cookie — never accessible to JS
    session: {
        strategy:  'jwt',
        maxAge:    8 * 60 * 60, // 8 hours
    },

    secret: process.env.NEXTAUTH_SECRET,

    pages: {
        signIn:  '/admin/login',
        error:   '/admin/login',
    },

    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                login:    { label: 'Email or Username', type: 'text'     },
                password: { label: 'Password',          type: 'password' },
            },

            async authorize(credentials) {
                if (!credentials?.login || !credentials?.password) return null;

                const identifier = credentials.login.trim();

                // Match by email (case-insensitive) or by name (as stored)
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: identifier.toLowerCase() },
                            { name: identifier },
                        ],
                    },
                });

                // User not found
                if (!user) return null;

                // Account deactivated
                if (!user.active) return null;

                // Wrong password
                const valid = await bcrypt.compare(credentials.password, user.password);
                if (!valid) return null;

                return {
                    id:    String(user.id),
                    name:  user.name,
                    email: user.email,
                    role:  user.role,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            // On first sign in, attach role + id to token
            if (user) {
                token.id   = user.id;
                token.role = user.role;
            }
            return token;
        },

        async session({ session, token }) {
            // Attach to session so components can read role
            if (token) {
                session.user.id   = token.id;
                session.user.role = token.role;
            }
            return session;
        },
    },
};