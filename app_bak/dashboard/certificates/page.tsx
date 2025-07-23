import { FaCertificate, FaMedal, FaDownload } from 'react-icons/fa'

export default function CertificatesPage() {
  // Datos de ejemplo
  const certificates = [
    {
      id: 1,
      courseName: 'Introducción al Machine Learning',
      issueDate: '10/04/2024',
      instructor: 'Dra. Ana López',
      credentialId: 'COGML-2024-1234',
      type: 'Certificado de Finalización'
    },
    {
      id: 2,
      courseName: 'Fundamentos de Desarrollo Web',
      issueDate: '25/02/2024',
      instructor: 'Ing. Carlos Ruiz',
      credentialId: 'COGWEB-2024-5678',
      type: 'Certificado de Competencia'
    }
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Certificados</h1>
        <p className="text-gray-600">Revisa y descarga tus certificados de cursos completados</p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map(certificate => (
            <div key={certificate.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#132944] to-[#3C31A3] p-4 text-white flex items-center justify-between">
                <div className="flex items-center">
                  <FaCertificate className="text-3xl mr-3" />
                  <div>
                    <h3 className="font-semibold">{certificate.type}</h3>
                    <p className="text-sm text-white/80">Emitido: {certificate.issueDate}</p>
                  </div>
                </div>
                <FaMedal className="text-yellow-300 text-2xl" />
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
      ) : (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FaCertificate className="text-gray-400 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No tienes certificados aún</h3>
          <p className="text-gray-500 mb-6">Completa cursos para obtener certificados</p>
          <button className="px-4 py-2 bg-[#3C31A3] text-white rounded-lg hover:bg-[#2c2376] transition-colors">
            Explorar cursos
          </button>
        </div>
      )}
    </div>
  )
} 