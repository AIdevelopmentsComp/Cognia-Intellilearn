import { HeaderComponent } from '@/components/common/header'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderComponent />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  )
} 