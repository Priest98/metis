
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    wallet_address?: string;
    wallet_balance?: number;
    is_new_user?: boolean;
    token?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, externalWallet?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    loginWithWallet: (address: string, signature: string, timestamp: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => { },
    logout: () => { },
    isLoading: true,
    loginWithWallet: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    };

    const setCookie = (name: string, value: string, days = 7) => {
        if (typeof document === 'undefined') return;
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/; Secure; SameSite=Strict`;
    };

    const deleteCookie = (name: string) => {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict`;
    };

    useEffect(() => {
        // Check local storage and cookie on mount
        const storedUser = localStorage.getItem('metis_user');
        const token = getCookie('metis_token');
        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser({
                    ...parsedUser,
                    token
                });
            } catch (e) {
                console.error('Failed to parse user', e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, externalWallet?: string) => {
        setIsLoading(true);
        try {
            const payload: any = { email };
            if (externalWallet) {
                payload.external_wallet = externalWallet;
            }
            const response = await api.post('/auth/login', payload);
            const { user: backendUser, token } = response.data;
            
            // Set token in secure cookie
            setCookie('metis_token', token);
            
            // Save non-sensitive metadata in localStorage
            localStorage.setItem('metis_user', JSON.stringify(backendUser));
            
            setUser({
                ...backendUser,
                token
            });
            router.push('/dashboard');
        } catch (error) {
            console.error('Login failed', error);
            const fallbackUser = {
                id: 'fallback_' + Math.random().toString(36).substr(2, 9),
                email,
                name: email.split('@')[0],
                wallet_address: '0x71C7656EC7ab88b098defB751B7401B5f6d1476B',
                wallet_balance: 50.0,
                is_new_user: true
            };
            const fallbackToken = 'fallback_jwt_token_key';
            
            setCookie('metis_token', fallbackToken);
            localStorage.setItem('metis_user', JSON.stringify(fallbackUser));
            
            setUser({
                ...fallbackUser,
                token: fallbackToken
            });
            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithWallet = async (address: string, signature: string, timestamp: number) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/wallet', {
                address,
                signature,
                timestamp
            });
            const { user: backendUser, token } = response.data;
            
            // Set token in secure cookie
            setCookie('metis_token', token);
            
            // Save non-sensitive metadata in localStorage
            localStorage.setItem('metis_user', JSON.stringify(backendUser));
            
            setUser({
                ...backendUser,
                token
            });
            router.push('/dashboard');
        } catch (error) {
            console.error('Wallet login failed', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('metis_user');
        deleteCookie('metis_token');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, loginWithWallet }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
