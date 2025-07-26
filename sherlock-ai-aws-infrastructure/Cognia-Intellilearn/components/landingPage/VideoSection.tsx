'use client'

import React from 'react'

export default function VideoSection() {
    return (
        <section className="px-6 py-16 bg-white">
            <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-[#132944] mb-4">
                    Descubre CognIA en Acción
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
                    Mira cómo nuestra plataforma está revolucionando la educación en línea con inteligencia artificial.
                </p>
                
                <div className="neuro-container rounded-3xl p-4 bg-white">
                    <video
                        className="w-full h-[220px] md:h-[450px] object-cover rounded-3xl"
                        controls
                        muted
                        playsInline
                        poster="/assets/images/video-thumbnail.jpg"
                    >
                        <source 
                            src="https://intellilearn-final.s3.amazonaws.com/assets/videos/Dise%C3%B1o%20sin+t%C3%ADtulo+%281%29.mp4" 
                            type="video/mp4" 
                        />
                        Tu navegador no soporta la reproducción de videos HTML5.
                    </video>
                </div>
                
                <p className="text-sm text-gray-500 font-medium mt-4">
                    ✨ Experiencia educativa impulsada por IA
                </p>
            </div>
        </section>
    )
} 