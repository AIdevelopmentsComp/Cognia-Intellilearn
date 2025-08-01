import React from 'react'
import { HeaderComponent } from '@/components/common/header'
import { FooterComponet } from '@/components/common/footer'
import LandingPage from '@/components/landingPage/LandingPage'
import { FloatingAssistant } from '@/components/common/FloatingAssistant'

export default function HomePage() {
  return (
    <>
      <HeaderComponent />
      <main>
        <LandingPage />
      </main>
      <FooterComponet />
      <FloatingAssistant />
    </>
  )
} 