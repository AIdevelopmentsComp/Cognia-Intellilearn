import BlueParticles from '@/components/common/BlueParticles';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#132944] via-[#1a3a5c] to-[#3C31A3] flex items-center justify-center relative overflow-hidden">
      <BlueParticles />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
} 