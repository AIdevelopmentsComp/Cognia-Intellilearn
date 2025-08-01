import { NextPage } from 'next'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import DashboardContent from '@/components/modules/dashboard/Dashboard'

const DashboardPage: NextPage = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard" description="Panel principal de CognIA">
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default DashboardPage 