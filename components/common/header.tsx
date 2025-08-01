import { useState, useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import { signInWithGoogle, signOut } from '@/lib/firebaseAuth';

export const HeaderComponent = () => {
    const { user, loading, error: authError } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugging, setDebugging] = useState(false);

    // Redirigir al dashboard si el usuario está autenticado y está en la landing page
    useEffect(() => {
        if (user && router.pathname === '/') {
            router.push('/dashboard');
        }
    }, [user, router]);

    // Mostrar errores de autenticación del contexto
    useEffect(() => {
        if (authError) {
            setError(`Error en autenticación: ${authError.message}`);
        }
    }, [authError]);

    // Limpiar mensajes de error después de 10 segundos
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("Iniciando proceso de autenticación con Google...");
            const result = await signInWithGoogle();
            console.log("Resultado de autenticación:", result);
            
            if (!result.success) {
                // Usar el mensaje de error descriptivo si está disponible
                const errorMessage = result.errorMessage || 
                    (result.error instanceof Error ? result.error.message : 'Error desconocido al iniciar sesión');
                setError(`Error: ${errorMessage}`);
            }
        } catch (err) {
            console.error('Error durante el inicio de sesión:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error al iniciar sesión: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await signOut(window.location.origin);
            if (!result.success) {
                const errorMessage = result.error instanceof Error 
                    ? result.error.message 
                    : 'Error desconocido al cerrar sesión';
                setError(`Error al cerrar sesión: ${errorMessage}`);
            }
        } catch (err) {
            console.error('Error durante el cierre de sesión:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error al cerrar sesión: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDebug = () => {
        setDebugging(!debugging);
    };

    return (
        <header className="w-full bg-white py-4 px-6 md:px-10 flex items-center justify-between shadow-sm z-10">
            <Link href="/" className="text-2xl font-bold tracking-wide">
                <Image
                    src="/assets/images/Logo.svg"
                    alt="CognIA Logo"
                    width={180}
                    height={48}
                    quality={100}
                    priority
                />
            </Link>
            
            <nav className="hidden md:flex items-center gap-4 text-sm">
                <a href="#" className="btn-header">¿Cómo Funciona?</a>
                <a href="#" className="btn-header">Beneficios</a>
                <a href="#" className="btn-header">Testimonios</a>
                <button className="btn-header-gradient">Solicitar Demo</button>
            </nav>
            
            {loading || isLoading ? (
                <div className="flex items-center justify-center w-8 h-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
                </div>
            ) : user ? (
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-700 hover:text-purple-700">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            <Image 
                                src={user.photoURL || '/assets/images/default-avatar.png'} 
                                alt={user.displayName || 'Usuario'} 
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-medium">{user.displayName?.split(' ')[0]}</span>
                    </Link>
                    <button 
                        onClick={handleSignOut}
                        className="btn-login flex items-center text-sm"
                    >
                        Salir
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-end">
                    <button 
                        onClick={handleSignIn}
                        className="btn-login flex items-center gap-2"
                        disabled={isLoading}
                    >
                        <FcGoogle className="text-xl" />
                        <span>Iniciar con Google</span>
                    </button>
                    
                    {error && (
                        <div className="text-red-500 text-xs mt-1 max-w-xs text-right">
                            {error}
                            <button 
                                onClick={toggleDebug} 
                                className="underline ml-1 text-blue-500"
                            >
                                {debugging ? 'Ocultar detalles' : 'Ver detalles'}
                            </button>
                        </div>
                    )}
                    
                    {debugging && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs max-w-xs overflow-auto max-h-40">
                            <p className="font-bold">Información de depuración:</p>
                            <p>Estado de carga: {loading ? 'Cargando' : 'Completado'}</p>
                            <p>Usuario: {user ? 'Autenticado' : 'No autenticado'}</p>
                            <p>Proyecto: cogniaintellilearn-ebdb3</p>
                            <p>API Key: AIzaSyB2SyW8F0RSYud2XSwwB0HIYR_PtBgSV_s</p>
                            <p>Auth Domain: cogniaintellilearn-ebdb3.firebaseapp.com</p>
                        </div>
                    )}
                </div>
            )}
        </header>
    )
}