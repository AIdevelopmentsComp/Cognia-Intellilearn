'use client'
import React from 'react'
import Image from 'next/image';
import { FaUniversity, FaGraduationCap, FaStar } from 'react-icons/fa';
import { TbUserShare } from 'react-icons/tb';
import { FcGoogle } from 'react-icons/fc';
import { signIn } from 'next-auth/react';
import AutoCarousel from '../autoCarrousel/autoCarrousel';

export default function LandingPage() {

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
            {/* Hero Section */}
            <section className="bg-gradient-banner py-16 px-6 text-center md:text-left md:flex md:items-center md:justify-between gap-8">
                <div className="max-w-xl mx-auto md:mx-0">
                    <h1 className="text-[65px] font-bold mb-4 leading-tight text-gray-900">
                        Tu Campus Virtual con <span className="textCognIa z-10 relative">CognIA
                            <Image
                                className='absolute left-0 top-1/2 -translate-y-1/2 z-20 w-[511px] text-[20px]'
                                src={'/assets/images/Subrayado.svg'}
                                alt="subrayado"
                                width={310}
                                height={73}
                                quality={100}
                            />
                        </span>
                    </h1>
                    <p className="mb-6 text-base">Transforma tu institución con nuestra plataforma para ofrecer carreras en línea de alta calidad, impulsadas por inteligencia artificial.</p>
                    <button className="btn-proof flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        Prueba nuestro asistente
                    </button>
                </div>
                <div className="mt-10 md:mt-0 w-full md:w-1/2 flex justify-center">
                    <Image
                        className='w-full max-w-md'
                        src={'/assets/images/OBJECTS.svg'}
                        alt="Descriptive text for accessibility"
                        width={800}
                        height={600}
                        priority
                    />
                </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-10 bg-white text-center">
                <div className="bg-item">
                    <p className="text-start text-[40px] font-bold">500+</p>
                    <p className="w-[207px] text-[16px] text-start mt-2">Instituciones transformando la educación en línea.</p>
                    <div className='flex justify-end'>
                        <p className='icon-item'>
                            <FaUniversity />
                        </p>
                    </div>
                </div>
                <div className="bg-item">
                    <p className="text-start text-[40px] font-bold">50.000+</p>
                    <p className="w-[207px] text-[16px] text-start mt-2">Estudiantes aprendiendo con inteligencia artificial.</p>
                    <div className='flex justify-end'>
                        <p className='icon-item'>
                            <FaGraduationCap />
                        </p>
                    </div>
                </div>
                <div className="bg-item">
                    <p className="text-start text-[40px] font-bold">5.000+</p>
                    <p className="w-[207px] text-[16px] text-start mt-2">Docentes optimizando su enseñanza.</p>
                    <div className='flex justify-end'>
                        <p className='icon-item'>
                            <TbUserShare />
                        </p>
                    </div>
                </div>
                <div className="bg-item">
                    <p className="text-start text-[40px] font-bold">98%</p>
                    <p className="w-[207px] text-[16px] text-start mt-2">Satisfacción con la experiencia de aprendizaje.</p>
                    <div className='flex justify-end'>
                        <p className='icon-item'>
                            <FaStar />
                        </p>
                    </div>
                </div>
            </section>

            {/* Campus Virtual Integral */}
            <section className="py-4 px-6 bg-white">
                <div className="text-center mb-10">
                    <h2 className="textCognIA">Descubre cómo ofrecer carreras en línea con CognIA</h2>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="bg-gradient-to-r from-[#132944] to-[#3C31A3] text-white text-center p-10 rounded-2xl shadow-lg">
                        <h2 className="text-[40px] font-bold mb-4">Campus virtual integral</h2>
                        <p className="text-[16px] mx-auto font-light">
                            Todo lo que necesitas para ofrecer
                        </p>
                        <p className="text-[16px] font-light">
                            servicios educativos completos en línea.
                        </p>
                        <Image
                            className="mx-auto w-full max-w-4xl"
                            src={'/assets/images/Image.svg'}
                            alt="subrayado"
                            width={541}
                            height={281}
                            quality={100}
                        />
                    </div>
                    <div className="w-full md:w-1/2 space-y-6 mt-8 md:mt-0">
                        <div className="wrappItem">
                            <h3 className="text-[20px] font-bold mb-1">Gestión académica completa.</h3>
                            <p className="text-[16px]">Administra planes de estudio, materias, evaluaciones y titulación en un solo lugar. Compatible con normas educativas internacionales.</p>
                        </div>
                        <div className="wrappItem">
                            <h3 className="text-[20px] font-bold mb-1">Comunidad de aprendizaje.</h3>
                            <p className="text-[16px]">Foros, trabajo colaborativo, sesiones en vivo y networking profesional integrado en la plataforma para una experiencia universitaria completa.</p>
                        </div>
                        <div className="wrappItem">
                            <h3 className="text-[20px] font-bold mb-1">Analítica educativa avanzada.</h3>
                            <p className="text-[16px]">Métricas de progresión académica, detección temprana de deserción y análisis de efectividad de programas para optimizar tu oferta educativa.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Beneficios (Placeholder) */}
            <section className="text-center py-10">
                <h2 className="textCognIA">Beneficios de nuestra plataforma</h2>
            </section>

            {/* Sección informativa + chatbot */}
            <section className="py-20 px-4 md:px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-4">
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
                                className="p-[1px] rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(19, 41, 68, 1), rgba(171, 171, 239, 1))'
                                }}
                            >
                                <div className="rounded-[10px] bg-white p-6 shadow-sm hover:shadow-md transition">
                                    <h3 className="font-semibold text-[#132944] mb-1 text-[20px]">{title}</h3>
                                    <p className="text-[#132944] text-[16px]">{text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-br from-[#0B0D2A] to-[#2A1E90] text-white p-6 md:p-10 rounded-2xl shadow-xl space-y-6">
                        <h3 className="text-lg md:text-xl font-bold">
                            Habla con nuestro asistente y descubre cómo implementar programas académicos en línea.
                        </h3>
                        <div className="bg-white rounded-xl overflow-hidden">
                            <Image
                                className="w-full h-auto object-cover"
                                src={'/assets/images/Chat.svg'}
                                alt="chat-demo"
                                width={541}
                                height={281}
                                quality={100}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección de CTA */}
            <section className="relative bg-gradient-to-r from-[#0B0D2A] to-[#2A1E90] py-20 text-white text-center rounded-2xl shadow-lg mx-4 md:mx-6 overflow-hidden">
                {/* SVG izquierdo */}
                <div className="absolute left-0 top-0 h-full w-1/2">
                    <Image
                        className="h-full w-full object-cover"
                        src={'/assets/images/TexturaLeft.svg'}
                        alt="textura-left"
                        width={541}
                        height={281}
                        quality={100}
                    />
                </div>

                {/* SVG derecho */}
                <div className="absolute right-0 top-0 h-full w-1/2">
                    <Image
                        className="h-full w-full object-cover"
                        src={'/assets/images/TexturaReight.svg'}
                        alt="textura-left"
                        width={541}
                        height={281}
                        quality={100}
                    />
                </div>

                {/* Contenido */}
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl md:text-[54px] font-bold mb-4">
                        ¿Listo para digitalizar tu oferta académica?
                    </h2>
                    <p className="text-base sm:text-lg md:text-[20px] mb-8">
                        Comienza ahora iniciando sesión con tu cuenta de Google para acceder 
                        a todas las herramientas de aprendizaje.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                            className="bg-white text-[#2A1E90] font-semibold px-6 py-3 rounded-full shadow-md hover:bg-gray-100 transition flex items-center gap-2 justify-center"
                        >
                            <FcGoogle className="text-xl" />
                            Iniciar con Google
                        </button>
                        <button className="bg-transparent border-2 border-white text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-white/10 transition flex items-center gap-2 justify-center">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                            Solicitar Demo
                        </button>
                    </div>
                </div>
            </section>

            <section className="bg-white py-20 text-center relative overflow-hidden">
                <h2 className="text-[54px] font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-[rgba(19,41,68,1)] to-[rgba(60,49,163,1)]">
                    ¿Qué dicen nuestros clientes?
                </h2>

                <div className="blur-circle-left" />
                <div className="blur-circle-right" />
                <div>
                    <AutoCarousel items={testimonials1} speed={0.8} />
                </div>

                <div className='mt-8'>
                    <AutoCarousel items={testimonials2} speed={0.5} />
                </div>


            </section>
        </div>
    );
}
