import React from 'react'
import { NextPage } from 'next'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Analytics } from '@/components/modules/dashboard/Analytics'

const AnalyticsPage: NextPage = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Analytics" description="Estadísticas y análisis de tu aprendizaje">
        <Analytics />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default AnalyticsPage 