import React from 'react'
import Head from 'next/head'
import { HeaderComponent } from '@/components/common/header'
import { FooterComponet } from '@/components/common/footer'
import LandingPage from '@/components/landingPage/LandingPage'
import { FloatingAssistant } from '@/components/common/FloatingAssistant'

export default function Home() {
  return (
    <>
      <Head>
        <title>CognIA | Tu Campus Virtual con Inteligencia Artificial</title>
        <meta name="description" content="Plataforma educativa avanzada que utiliza inteligencia artificial para personalizar el aprendizaje" />
      </Head>
      <HeaderComponent />
      <main>
        <LandingPage />
      </main>
      <FooterComponet />
      <FloatingAssistant />
    </>
  )
} 