'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export const HeaderComponent = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = () => {
    console.log('✅ Logo loaded successfully');
  };

  const handleImageError = (e: any) => {
    console.error('❌ Logo failed to load:', e);
    console.error('Image src:', e.target.src);
    console.error('Image alt:', e.target.alt);
  };

  return (
    <header className="w-full bg-white py-4 px-6 md:px-10 flex items-center justify-between shadow-sm z-10">
      <Link href="/" className="text-2xl font-bold tracking-wide">
        <img
          src="/assets/images/Logo.svg"
          alt="CognIA Logo"
          width={287}
          height={77}
          style={{ maxWidth: '100%', height: 'auto' }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </Link>

      <nav className="hidden md:flex items-center gap-4 text-sm">
        <a href="#funciona" className="btn-header">¿Cómo Funciona?</a>
        <a href="#beneficios" className="btn-header">Beneficios</a>
        <a href="#testimonios" className="btn-header">Testimonios</a>
        <button className="btn-header-gradient">Solicitar Demo</button>
      </nav>

      {isLoading ? (
        <div className="flex items-center justify-center w-8 h-8">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
        </div>
      ) : user ? (
        <button 
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Cerrar Sesión
        </button>
      ) : (
        <Link 
          href="/auth/login" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Iniciar Sesión
        </Link>
      )}
    </header>
  );
};