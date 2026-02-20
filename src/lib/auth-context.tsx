"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// --- Types ---
export type UserRole = 'ADMIN' | 'OPERATOR';

export type User = {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    password?: string;
};

interface AuthContextType {
    user: User | null;
    users: User[];
    isLoading: boolean;
    login: (username: string, pass: string) => Promise<boolean>;
    logout: () => void;
    addUser: (user: Omit<User, "id">) => Promise<void>; // Changed to Promise
    updateUser: (id: string, updates: Partial<Omit<User, "id">>) => Promise<void>; // Changed to Promise
    deleteUser: (id: string) => Promise<void>; // Changed to Promise
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Load users and session
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                // Fetch users from API
                const res = await fetch('/api/auth/users');
                if (res.ok) {
                    const loadedUsers = await res.json();
                    setUsers(loadedUsers);

                    // Load Current Session
                    const storedSession = localStorage.getItem("auth_session");
                    if (storedSession) {
                        const sessionUser = JSON.parse(storedSession);
                        // Verify user still exists in list (in case they were deleted)
                        const validUser = loadedUsers.find((u: User) => u.id === sessionUser.id);
                        if (validUser) {
                            const { password, ...userWithoutPass } = validUser;
                            setUser(userWithoutPass as User);
                        } else {
                            localStorage.removeItem("auth_session");
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load users", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const login = async (username: string, pass: string): Promise<boolean> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let validUser = users.find(u => u.username === username && u.password === pass);

        // If not found locally, try fetching fresh list (in case of stale state)
        if (!validUser) {
            try {
                const res = await fetch('/api/auth/users');
                if (res.ok) {
                    const freshUsers = await res.json();
                    setUsers(freshUsers);
                    validUser = freshUsers.find((u: User) => u.username === username && u.password === pass);
                }
            } catch (e) {
                console.error("Login fetch error", e);
            }
        }

        if (validUser) {
            const { password, ...userWithoutPass } = validUser; // Don't store password in session state
            setUser(userWithoutPass as User);
            localStorage.setItem("auth_session", JSON.stringify(userWithoutPass));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("auth_session");
        router.push("/login"); // Redirect to login
    };

    const addUser = async (userData: Omit<User, "id">) => {
        try {
            const res = await fetch('/api/auth/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (res.ok) {
                const newUser = await res.json();
                setUsers([...users, newUser]);
            }
        } catch (error) {
            console.error("Failed to add user", error);
        }
    };

    const updateUser = async (id: string, updates: Partial<Omit<User, "id">>) => {
        try {
            const res = await fetch(`/api/auth/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updatedUser = await res.json();
                setUsers(users.map(u => u.id === id ? updatedUser : u));
            }
        } catch (error) {
            console.error("Failed to update user", error);
        }
    };

    const deleteUser = async (id: string) => {
        try {
            const res = await fetch(`/api/auth/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    // Global Route Protection
    useEffect(() => {
        if (isLoading) return;

        const publicRoutes = ["/login"];
        const isPublic = publicRoutes.includes(pathname);

        if (!user && !isPublic) {
            router.push("/login");
        } else if (user && isPublic) {
            // If logged in and trying to go to login, redirect based on role
            if (user.role === 'ADMIN') router.push("/");
            else router.push("/entry");
        } else if (user && user.role === 'OPERATOR') {
            // Restrict Operator to /entry only
            if (!pathname.startsWith("/entry")) {
                router.push("/entry");
            }
        }
    }, [user, isLoading, pathname, router]);

    // Prevent hydration mismatch and flash of protected content
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 border-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>;
    }

    // Don't render children if we are about to redirect
    const publicRoutes = ["/login"];
    const isPublic = publicRoutes.includes(pathname);
    if (!user && !isPublic) return null; // Wait for redirect to /login

    return (
        <AuthContext.Provider value={{
            user, users, isLoading,
            login, logout,
            addUser, updateUser, deleteUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
