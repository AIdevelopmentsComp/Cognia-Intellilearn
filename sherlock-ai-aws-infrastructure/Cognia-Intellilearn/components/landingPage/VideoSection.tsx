'use client'

import React, { useRef, useState } from 'react'
import City3D from './City3D'

export default function VideoSection() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseEnter = () => {
        setIsHovered(true)
        if (videoRef.current) {
            videoRef.current.play().catch(console.error)
        }
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        if (videoRef.current) {
            videoRef.current.pause()
        }
    }

    return (
        <section className="px-6 py-16 bg-white">
            <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-[#132944] mb-4">
                    Descubre CognIA en Acción
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
                    Mira cómo nuestra plataforma está revolucionando la educación en línea con inteligencia artificial.
                </p>
                
                <div 
                    className="neuro-container rounded-3xl p-4 bg-white relative overflow-hidden group"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        background: '#ffffff',
                        boxShadow: '12px 12px 24px rgba(163, 177, 198, 0.15), -12px -12px 24px rgba(255, 255, 255, 0.7)'
                    }}
                >
                    {/* Ciudad 3D de fondo */}
                    <City3D className="opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                    
                    {/* Video principal */}
                    <div className="relative z-10">
                        <video
                            ref={videoRef}
                            className="w-full h-[220px] md:h-[450px] object-cover rounded-3xl transition-all duration-500 hover:scale-[1.02]"
                            controls
                            muted
                            playsInline
                            loop
                            poster="/assets/images/video-thumbnail.jpg"
                            style={{
                                filter: 'brightness(1.05) contrast(1.02)',
                                boxShadow: '0 8px 32px rgba(60, 49, 163, 0.1)'
                            }}
                        >
                            <source 
                                src="https://intellilearn-final.s3.amazonaws.com/assets/videos/Dise%C3%B1o%20sin+t%C3%ADtulo+%281%29.mp4" 
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
                    
                    {/* Indicador de hover */}
                    {isHovered && (
                        <div className="absolute top-4 right-4 z-20 bg-[#3C31A3] text-white px-3 py-1 rounded-full text-xs font-medium opacity-90">
                            Reproduciendo automáticamente
                        </div>
                    )}
                </div>
                
                <p className="text-sm text-gray-500 font-medium mt-4">
                    ✨ Experiencia educativa impulsada por IA • Pasa el cursor sobre el video para reproducir automáticamente
                </p>
            </div>
        </section>
    )
} 