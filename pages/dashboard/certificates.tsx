import React from 'react'
import { NextPage } from 'next'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { FaCertificate, FaDownload } from 'react-icons/fa'

const CertificatesPage: NextPage = () => {
  // Datos de ejemplo
  const certificates = [
    {
      id: 1,
      courseName: 'Introducción al Machine Learning',
      issueDate: '10/04/2024',
      instructor: 'Dra. Ana López',
      credentialId: 'COGML-2024-1234',
      type: 'Certificado de Finalización',
      dateIssued: '10/04/2024'
    },
    {
      id: 2,
      courseName: 'Fundamentos de Desarrollo Web',
      issueDate: '25/02/2024',
      instructor: 'Ing. Carlos Ruiz',
      credentialId: 'COGWEB-2024-5678',
      type: 'Certificado de Competencia',
      dateIssued: '25/02/2024'
    }
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout title="Certificados" description="Tus certificados y credenciales">
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Certificados</h1>
            <p className="text-gray-600">Revisa y descarga tus certificados de cursos completados</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map(certificate => (
              <div key={certificate.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#132944] to-[#3C31A3] p-4 text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <FaCertificate className="text-3xl mr-3" />
                    <div>
                      <h3 className="font-semibold">{certificate.type}</h3>
                      <p className="text-sm text-white/80">Emitido: {certificate.dateIssued}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
                    <span className="text-[#132944] font-bold">🏆</span>
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">{certificate.courseName}</h2>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Instructor:</span> {certificate.instructor}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">ID de Credencial:</span> {certificate.credentialId}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button className="flex items-center px-4 py-2 bg-[#3C31A3] text-white rounded-lg hover:bg-[#2c2376] transition-colors">
                      <FaDownload className="mr-2" /> Descargar PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default CertificatesPage 