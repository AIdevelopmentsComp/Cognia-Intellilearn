'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { FiUser } from 'react-icons/fi';

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
    <header className="w-full bg-white py-4 px-6 md:px-10 flex items-center justify-between shadow-sm z-10 relative">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={`header-particle-${i}`}
            className="absolute w-1 h-1 bg-[#2A1E90] rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <Link href="/" className="text-2xl font-bold tracking-wide relative z-10">
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

      <nav className="hidden md:flex items-center gap-4 text-sm relative z-10">
        <a href="#funciona" className="neuro-button text-gray-700 hover:text-[#2A1E90] px-4 py-2 rounded-full transition-all duration-300 font-medium">
          How It Works?
        </a>
        <a href="#beneficios" className="neuro-button text-gray-700 hover:text-[#2A1E90] px-4 py-2 rounded-full transition-all duration-300 font-medium">
          Benefits
        </a>
        <a href="#testimonios" className="neuro-button text-gray-700 hover:text-[#2A1E90] px-4 py-2 rounded-full transition-all duration-300 font-medium">
          Testimonials
        </a>
        <button className="neuro-button bg-gradient-to-r from-[#2A1E90] to-[#4A3B9A] text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
          Request Demo
        </button>
      </nav>

      {isLoading ? (
        <div className="flex items-center justify-center w-8 h-8 relative z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
        </div>
      ) : (
        <div className="flex items-center gap-4 relative z-10">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Hello, {user.displayName || 'User'}</span>
              <button
                onClick={signOut}
                className="neuro-button bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="neuro-button bg-white border-2 border-[#2A1E90] text-[#2A1E90] px-6 py-2 rounded-full font-semibold hover:bg-[#2A1E90] hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <FiUser className="text-lg" />
              Log In
            </Link>
          )}
        </div>
      )}
    </header>
  );
};