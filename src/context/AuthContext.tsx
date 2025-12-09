import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';
import { supabase } from '../services/supabase';

// Auth Context
interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const userIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                if (userIdRef.current !== session.user.id) {
                    userIdRef.current = session.user.id;
                    fetchProfile(session.user.id, session.user.email!);
                }
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                if (userIdRef.current === session.user.id) return;

                userIdRef.current = session.user.id;
                setLoading(true);
                fetchProfile(session.user.id, session.user.email!);
            } else {
                userIdRef.current = null;
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, email: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            // Default to NO_ACCESS for new users
            const profile = data as any;
            const role = (profile && profile.role ? profile.role as Role : Role.NO_ACCESS);

            setUser({
                id: userId,
                name: (profile && profile.full_name) || email.split('@')[0],
                email: email,
                role: role,
                avatar: (profile && profile.avatar_url) || undefined
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const login = (userData: User) => {
        // No-op, handled by supabase auth state change
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
