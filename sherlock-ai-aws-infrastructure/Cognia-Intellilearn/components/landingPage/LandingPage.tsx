'use client'
/**
 * @fileoverview Landing Page Component with Neumorphism
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-14
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Main landing page component with neumorphic design elements while preserving
 * original branding, colors, and functionality.
 * 
 * @context
 * First page users see when visiting the platform. Showcases features,
 * testimonials, and conversion elements with modern neumorphic styling.
 * 
 * @changelog
 * v1.0.0 - Initial landing page implementation
 * v1.0.1 - Added testimonials carousel
 * v1.0.2 - Added stats section and CTA
 * v2.0.0 - Added neumorphic design system while preserving original branding
 */

import React from 'react'
import { FaUniversity, FaGraduationCap, FaStar } from 'react-icons/fa';
import { TbUserShare } from 'react-icons/tb';
import { useAuth } from '@/lib/AuthContext';
import AutoCarousel from '../autoCarrousel/autoCarrousel';
import Link from 'next/link';
import VideoSection from './VideoSection';


/**
 * Main landing page component with neumorphic styling
 * Preserves all original colors, logos, and branding elements
 */
export default function LandingPage() {
    const { user } = useAuth();

    /**
     * Testimonials data for institutions carousel
     */
    const testimonials1 = [
        {
            text: '"Gracias a esta plataforma, digitalizamos nuestras licenciaturas sin complicaciones. La implementación fue rápida y eficiente."',
            author: '- Dr. Luis Mendoza, Rector de Universidad Global',
            icon: (
                <TbUserShare />

            ),
        },
        {
            text: '"Ahora podemos ofrecer programas en línea con la misma calidad que nuestros cursos presenciales. Una solución integral y escalable."',
            author: '— Marta Ríos, Instituto Avanza',
            icon: (
                <FaUniversity />
            ),
        },
        {
            text: '"Ampliamos nuestra oferta educativa a estudiantes de todo el mundo. Ha sido una revolución para nuestra institución."',
            author: '— Carlos Benítez, Educación Virtual',
            icon: (
                <TbUserShare />
            ),
        },
        {
            text: '"Ampliamos nuestra oferta educativa a estudiantes de todo el mundo. Ha sido una revolución para nuestra institución."',
            author: '— Carlos Benítez, Educación Virtual',
            icon: (
                <TbUserShare />
            ),
        },

    ]
    
    /**
     * Testimonials data for students carousel
     */
    const testimonials2 = [
        {
            text: '"Puedo estudiar a mi propio ritmo y recibir explicaciones claras gracias a la inteligencia artificial. ¡Me siento más seguro en mis exámenes!"',
            author: '— Daniel Romero, Estudiante de Administración',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2A1E90]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 14l6.16-3.422A12.083 12.083 0 0121 13.458M12 14v7m0 0H7m5 0h5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            text: '"Las clases en línea ahora son más interactivas y prácticas. Se siente como tener un tutor personal disponible 24/7."',
            author: '— Sofía Martínez, Ingeniería de Software',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2A1E90]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 12h6m2 0a2 2 0 100-4h-2a2 2 0 00-2-2h-2a2 2 0 00-2 2H7a2 2 0 100 4h2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            text: '"Antes tenía dificultades para organizar mi estudio, pero ahora todo está estructurado y adaptado a mi ritmo."',
            author: '— Andrés Gutiérrez, Estudiante de Psicología',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#2A1E90]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 14l6.16-3.422A12.083 12.083 0 0121 13.458M12 14v7m0 0H7m5 0h5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ]
    
    return (
        <div className="bg-white text-gray-800">
            {/* Hero Section with neumorphism */}
            <section className="bg-gradient-banner py-16 px-6 text-center md:text-left md:flex md:items-center md:justify-between gap-8">
                <div className="max-w-xl mx-auto md:mx-0">
                    <h1 className="text-[65px] font-bold mb-4 leading-tight text-gray-900">
                        Tu Campus Virtual con <span className="textCognIa z-10 relative">CognIA
                            <img
                                className='absolute left-0 top-1/2 -translate-y-1/2 z-20 w-[511px] text-[20px]'
                                src={'/assets/images/Subrayado.svg'}
                                alt="subrayado"
                                width={310}
                                height={73}
                            />
                        </span>
                    </h1>
                    <p className="mb-6 text-base">Transforma tu institución con nuestra plataforma para ofrecer carreras en línea de alta calidad, impulsadas por inteligencia artificial.</p>
                    <button className="btn-proof flex items-center gap-2 neuro-button-primary transition-all duration-300">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        Prueba nuestro asistente
                    </button>
                </div>
                <div className="mt-10 md:mt-0 w-full md:w-1/2 flex justify-center">
                    <div className="neuro-container rounded-3xl p-4">
                        <img
                            className='w-full max-w-md rounded-2xl'
                            src={'/assets/images/OBJECTS.svg'}
                            alt="Descriptive text for accessibility"
                            width={800}
                            height={600}
                        />
                    </div>
                </div>
            </section>

            {/* Video Section con Ciudad 3D */}
            <VideoSection />

            {/* Stats Section with neumorphism */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 py-10 bg-white text-center">
                <div className="bg-item neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <p className="text-start text-[40px] font-bold">500+</p>
                    <p className="w-[207px] text-[16px] text-start mt-2">Instituciones transformando la educación en línea.</p>
                    <div className='flex justify-end'>
                        <div className='icon-item neuro-icon'>
                            <FaUniversity />
                        </div>
                    </div>
                </div>
                <div className="bg-item neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <p className="text-start text-[40px] font-bold">50.000+</p>
                    <p className="w-[207px] text-[16px] text-start mt-2">Estudiantes aprendiendo con inteligencia artificial.</p>
                    <div className='flex justify-end'>
                        <div className='icon-item neuro-icon'>
                            <FaGraduationCap />
                        </div>
                    </div>
                </div>
                <div className="bg-item neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <p className="text-start text-[40px] font-bold">5.000+</p>
                    <p className="w-[207px] text-[16px] text-start mt-2">Docentes optimizando su enseñanza.</p>
                    <div className='flex justify-end'>
                        <div className='icon-item neuro-icon'>
                            <TbUserShare />
                        </div>
                    </div>
                </div>
                <div className="bg-item neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <p className="text-start text-[40px] font-bold">98%</p>
                    <p className="w-[207px] text-[16px] text-start mt-2">Satisfacción con la experiencia de aprendizaje.</p>
                    <div className='flex justify-end'>
                        <div className='icon-item neuro-icon'>
                            <FaStar />
                        </div>
                    </div>
                </div>
            </section>

            {/* Campus Virtual Integral Section with neumorphism */}
            <section className="py-4 px-6 bg-white">
                <div className="text-center mb-10">
                    <h2 className="textCognIA">Descubre cómo ofrecer carreras en línea con CognIA</h2>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="bg-gradient-to-r from-[#132944] to-[#3C31A3] text-white text-center p-10 rounded-2xl shadow-lg neuro-container">
                        <h2 className="text-[40px] font-bold mb-4">Campus virtual integral</h2>
                        <p className="text-[16px] mx-auto font-light">
                            Todo lo que necesitas para ofrecer
                        </p>
                        <p className="text-[16px] font-light">
                            servicios educativos completos en línea.
                        </p>
                        <div className="neuro-inset rounded-2xl p-4 mt-6">
                            <img
                                className="mx-auto w-full max-w-4xl rounded-xl"
                                src={'/assets/images/Image.svg'}
                                alt="subrayado"
                                width={541}
                                height={281}
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-6 mt-8 md:mt-0">
                        <div className="wrappItem neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-[20px] font-bold mb-1">Gestión académica completa.</h3>
                            <p className="text-[16px]">Administra planes de estudio, materias, evaluaciones y titulación en un solo lugar. Compatible con normas educativas internacionales.</p>
                        </div>
                        <div className="wrappItem neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-[20px] font-bold mb-1">Comunidad de aprendizaje.</h3>
                            <p className="text-[16px]">Foros, trabajo colaborativo, sesiones en vivo y networking profesional integrado en la plataforma para una experiencia universitaria completa.</p>
                        </div>
                        <div className="wrappItem neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-[20px] font-bold mb-1">Analítica educativa avanzada.</h3>
                            <p className="text-[16px]">Métricas de progresión académica, detección temprana de deserción y análisis de efectividad de programas para optimizar tu oferta educativa.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section with neumorphism */}
            <section className="text-center py-10">
                <div className="neuro-container rounded-2xl p-8 mx-6">
                    <h2 className="textCognIA">Beneficios de nuestra plataforma</h2>
                </div>
            </section>

            {/* Informative Section + Chatbot with neumorphism */}
            <section className="py-20 px-4 md:px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        {[
                            {
                                title: 'Infraestructura para Programas Académicos Online.',
                                text: 'Facilita la gestión de licenciaturas, maestrías y diplomados en un entorno digital completo.'
                            },
                            {
                                title: 'Expansión Educativa sin Fronteras.',
                                text: 'Llega a estudiantes de cualquier parte del mundo sin límites geográficos.'
                            },
                            {
                                title: 'Aprendizaje Adaptativo con IA.',
                                text: 'Personaliza la enseñanza según el ritmo y necesidades de cada estudiante.'
                            },
                            {
                                title: 'Inversión Inteligente y Rentable.',
                                text: 'Aumenta la retención estudiantil y optimiza costos operativos.'
                            }
                        ].map(({ title, text }, i) => (
                            <div
                                key={i}
                                className="neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(19, 41, 68, 0.05), rgba(171, 171, 239, 0.05))'
                                }}
                            >
                                <div className="rounded-xl bg-white/50 p-1">
                                    <div className="neuro-inset rounded-lg p-5">
                                        <h3 className="font-semibold text-[#132944] mb-1 text-[20px]">{title}</h3>
                                        <p className="text-[#132944] text-[16px]">{text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-br from-[#132944] to-[#3C31A3] text-white p-6 md:p-10 rounded-2xl shadow-xl space-y-6 neuro-container">
                        <h3 className="text-lg md:text-xl font-bold">
                            Habla con nuestro asistente y descubre cómo implementar programas académicos en línea.
                        </h3>
                        <div className="neuro-inset bg-white rounded-2xl overflow-hidden p-2">
                            <img
                                className="w-full h-auto object-cover rounded-xl"
                                src={'/assets/images/Chat.svg'}
                                alt="chat-demo"
                                width={541}
                                height={281}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section with neumorphism */}
            <section className="relative bg-gradient-to-r from-[#132944] to-[#3C31A3] py-20 text-white text-center rounded-2xl shadow-lg mx-4 md:mx-6 overflow-hidden neuro-container">
                {/* SVG izquierdo */}
                <div className="absolute left-0 top-0 h-full w-1/2">
                    <img
                        className="h-full w-full object-cover"
                        src={'/assets/images/TexturaLeft.svg'}
                        alt="textura-left"
                        width={541}
                        height={281}
                    />
                </div>

                {/* SVG derecho */}
                <div className="absolute right-0 top-0 h-full w-1/2">
                    <img
                        className="h-full w-full object-cover"
                        src={'/assets/images/TexturaReight.svg'}
                        alt="textura-right"
                        width={541}
                        height={281}
                    />
                </div>

                {/* Contenido */}
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl md:text-[54px] font-bold mb-4">
                        ¿Listo para digitalizar tu oferta académica?
                    </h2>
                    <p className="text-base sm:text-lg md:text-[20px] mb-8">
                        Comienza ahora iniciando sesión para acceder 
                        a todas las herramientas de aprendizaje.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        {user ? (
                            <Link 
                                href="/dashboard"
                                className="neuro-button bg-white text-[#2A1E90] font-semibold px-6 py-3 rounded-full shadow-md hover:bg-gray-100 transition-all duration-300 flex items-center gap-2 justify-center"
                            >
                                <span className="w-2 h-2 bg-[#2A1E90] rounded-full"></span>
                                Ir al Dashboard
                            </Link>
                        ) : (
                            <Link 
                                href="/auth/login"
                                className="neuro-button bg-white text-[#2A1E90] font-semibold px-6 py-3 rounded-full shadow-md hover:bg-gray-100 transition-all duration-300 flex items-center gap-2 justify-center"
                            >
                                <span className="w-2 h-2 bg-[#2A1E90] rounded-full"></span>
                                Iniciar Sesión
                            </Link>
                        )}
                        <button className="neuro-button bg-transparent border-2 border-white text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-white/10 transition-all duration-300 flex items-center gap-2 justify-center">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                            Solicitar Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Testimonials Section with neumorphism */}
            <section className="bg-white py-20 text-center relative overflow-hidden">
                <div className="neuro-container rounded-2xl p-8 mx-6 mb-10">
                    <h2 className="text-[54px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[rgba(19,41,68,1)] to-[rgba(60,49,163,1)]">
                        ¿Qué dicen nuestros clientes?
                    </h2>
                </div>

                <div className="blur-circle-left" />
                <div className="blur-circle-right" />
                
                <div className="neuro-inset rounded-2xl mx-6 p-6 mb-8">
                    <AutoCarousel items={testimonials1} speed={0.8} />
                </div>

                <div className="neuro-inset rounded-2xl mx-6 p-6">
                    <AutoCarousel items={testimonials2} speed={0.5} />
                </div>
            </section>
        </div>
    );
}
