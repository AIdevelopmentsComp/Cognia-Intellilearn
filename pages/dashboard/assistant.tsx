import React from 'react'
import { AssistantAI } from '@/components/modules/dashboard/AssistantAI'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'

export default function AssistantPage() {
  return (
    <DashboardLayout title="Asistente IA" description="Tu asistente personal de aprendizaje">
      <AssistantAI />
    </DashboardLayout>
  )
} 