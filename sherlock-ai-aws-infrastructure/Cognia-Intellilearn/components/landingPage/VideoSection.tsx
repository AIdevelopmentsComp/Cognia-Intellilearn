'use client'

import React, { useRef, useState } from 'react'
import { FaUniversity, FaGraduationCap, FaStar } from 'react-icons/fa'
import { TbUserShare } from 'react-icons/tb'

export default function VideoSection() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseEnter = () => {
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
    }

    // Auto-play video when component loads
    const handleVideoLoad = () => {
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.log('Auto-play blocked by browser:', error.name)
            })
        }
    }

    return (
        <section className="bg-white relative overflow-hidden">
            {/* Partículas de fondo más visibles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Partículas grandes azules */}
                {[...Array(15)].map((_, i) => (
                    <div
                        key={`large-${i}`}
                        className="absolute w-3 h-3 bg-blue-400/60 rounded-full animate-pulse shadow-lg"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                        }}
                    />
                ))}
                
                {/* Partículas medianas */}
                {[...Array(25)].map((_, i) => (
                    <div
                        key={`medium-${i}`}
                        className="absolute w-2 h-2 bg-blue-300/70 rounded-full animate-bounce shadow-md"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 4}s`,
                            animationDuration: `${1.5 + Math.random() * 2}s`,
                            boxShadow: '0 0 8px rgba(96, 165, 250, 0.4)'
                        }}
                    />
                ))}
                
                {/* Partículas pequeñas brillantes */}
                {[...Array(35)].map((_, i) => (
                    <div
                        key={`small-${i}`}
                        className="absolute w-1 h-1 bg-blue-200/80 rounded-full animate-ping shadow-sm"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 2}s`,
                            boxShadow: '0 0 6px rgba(147, 197, 253, 0.6)'
                        }}
                    />
                ))}
                
                {/* Líneas conectoras más visibles */}
                {[...Array(6)].map((_, i) => (
                    <div
                        key={`line-${i}`}
                        className="absolute h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse rounded-full"
                        style={{
                            left: `${Math.random() * 70}%`,
                            top: `${Math.random() * 70}%`,
                            width: `${30 + Math.random() * 40}%`,
                            transform: `rotate(${Math.random() * 360}deg)`,
                            animationDelay: `${Math.random() * 3}s`,
                            boxShadow: '0 0 4px rgba(96, 165, 250, 0.3)'
                        }}
                    />
                ))}
                
                {/* Círculos de conexión */}
                {[...Array(4)].map((_, i) => (
                    <div
                        key={`circle-${i}`}
                        className="absolute border border-blue-300/40 rounded-full animate-spin"
                        style={{
                            left: `${Math.random() * 80}%`,
                            top: `${Math.random() * 80}%`,
                            width: `${20 + Math.random() * 30}px`,
                            height: `${20 + Math.random() * 30}px`,
                            animationDuration: `${10 + Math.random() * 10}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            {/* Cards de estadísticas ocupando todo el ancho - inmediatamente después del hero */}
            <div className="w-full px-6 py-12 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                        <div className="bg-item neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <p className="text-start text-[40px] font-bold">500+</p>
                            <p className="w-full text-[16px] text-start mt-2">Instituciones transformando la educación en línea.</p>
                            <div className='flex justify-end'>
                                <div className='icon-item neuro-icon'>
                                    <FaUniversity />
                                </div>
                            </div>
                        </div>
                        <div className="bg-item neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <p className="text-start text-[40px] font-bold">50.000+</p>
                            <p className="w-full text-[16px] text-start mt-2">Estudiantes aprendiendo con inteligencia artificial.</p>
                            <div className='flex justify-end'>
                                <div className='icon-item neuro-icon'>
                                    <FaGraduationCap />
                                </div>
                            </div>
                        </div>
                        <div className="bg-item neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <p className="text-start text-[40px] font-bold">5.000+</p>
                            <p className="w-full text-[16px] text-start mt-2">Docentes optimizando su enseñanza.</p>
                            <div className='flex justify-end'>
                                <div className='icon-item neuro-icon'>
                                    <TbUserShare />
                                </div>
                            </div>
                        </div>
                        <div className="bg-item neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <p className="text-start text-[40px] font-bold">98%</p>
                            <p className="w-full text-[16px] text-start mt-2">Satisfacción con la experiencia de aprendizaje.</p>
                            <div className='flex justify-end'>
                                <div className='icon-item neuro-icon'>
                                    <FaStar />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de dos columnas: Texto izquierda, Video derecha */}
            <div className="w-full px-6 py-16 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Columna izquierda - Texto */}
                        <div className="text-left lg:pr-8">
                            <h2 className="textCognIA mb-6 text-left">
                                Descubre CognIA en Acción
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Mira cómo nuestra plataforma está revolucionando la educación en línea con inteligencia artificial.
                            </p>
                        </div>

                        {/* Columna derecha - Video */}
                        <div 
                            className="neuro-container rounded-3xl p-6 bg-white relative overflow-hidden group"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                background: '#ffffff',
                                boxShadow: '12px 12px 24px rgba(163, 177, 198, 0.15), -12px -12px 24px rgba(255, 255, 255, 0.7)',
                                minHeight: '400px'
                            }}
                        >
                            {/* Video principal */}
                            <div className="relative z-20">
                                <video
                                    ref={videoRef}
                                    className="w-full h-[280px] md:h-[350px] object-cover rounded-3xl transition-all duration-500 hover:scale-[1.02]"
                                    controls
                                    muted
                                    autoPlay
                                    playsInline
                                    loop
                                    onLoadedData={handleVideoLoad}
                                    poster="/assets/images/video-thumbnail.jpg"
                                    style={{
                                        filter: 'brightness(1.05) contrast(1.02)',
                                        boxShadow: '0 8px 32px rgba(60, 49, 163, 0.1)'
                                    }}
                                >
                                    <source 
                                        src="https://intellilearn-final.s3.amazonaws.com/assets/videos/cognia-demo.mp4" 
                                        type="video/mp4" 
                                    />
                                    Tu navegador no soporta la reproducción de videos HTML5.
                                </video>
                                
                                {/* Overlay gradient para efecto neumórfico */}
                                <div 
                                    className="absolute inset-0 rounded-3xl pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(163,177,198,0.1) 100%)'
                                    }}
                                ></div>
                            </div>
                            
                            {/* Indicador de autoplay */}
                            <div className="absolute top-4 right-4 z-30 bg-[#3C31A3] text-white px-3 py-1 rounded-full text-xs font-medium opacity-90">
                                Video en reproducción automática
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
} 