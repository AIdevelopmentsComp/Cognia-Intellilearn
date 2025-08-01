import { AiOutlineMail } from 'react-icons/ai';
import { BsTelephone, BsTwitterX } from 'react-icons/bs';
import { SlLocationPin } from 'react-icons/sl';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import Image from 'next/image';

export const FooterComponet = () => {
    return(
        <footer className="footer bg-gradient-to-r from-[#0D1B40] to-[#2D1F7F] text-white px-6 py-10 text-sm">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3">
          {/* Logo y texto */}
          <div>
             <div className="mb-6">
                                        <Image
                                            className=''
                                            src={'/assets/images/logo-white.svg'}
                                            alt="Logo"
                                            width={219}
                                            height={60}
                                            quality={100}
                                        />
                                    </div>
            <p className=" text-white/90 font-extralight text-[16px] leading-relaxed">
              Transformando la educación con la potencia de la inteligencia artificial. Solicita una demo y descubre cómo podemos ayudarte.
            </p>
          </div>
  
          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-[20px] font-semibold mb-3">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-white/90 text-[16px]">
              <li><a href="#funciona" className="hover:underline">¿Cómo Funciona?</a></li>
              <li><a href="#beneficios" className="hover:underline">Beneficios</a></li>
              <li><a href="#testimonios" className="hover:underline">Testimonios</a></li>
              <li><a href="#demo" className="hover:underline">Solicitar Demo</a></li>
            </ul>
          </div>
  
          {/* Contacto */}
          <div>
            <h3 className="text-[20px] font-semibold mb-3">Contáctanos</h3>
            <ul className="space-y-2 text-white/90 text-[16px]">
              <li className='flex items-center gap-2.5'><AiOutlineMail className='text-[22px]'/> info@cognia.edu</li>
              <li className='flex items-center gap-2.5'><BsTelephone className='text-[22px]'/> +52 (55) 1234-5678</li>
              <li className='flex items-center gap-2.5'><SlLocationPin className='text-[22px]'/> Ciudad de México, México</li>
            </ul>
          </div>
        </div>
  
        {/* Línea divisoria */}
        <div className="border-t border-white/20 my-6" />
  
        {/* Parte inferior */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-white/70 gap-4">
          <div className="flex gap-4 text-[12px]">
            <a href="#" className="hover:underline">Tratamiento de datos y Política de privacidad</a>
          </div>
          <p className='text-[12px]'>© 2025 CognIA. Todos los derechos reservados.</p>
          <div className='flex gap-4'>
            <a href="" className='text-[24px]'><BsTwitterX/></a>
            <a href="" className='text-[24px]'><FaFacebook/></a>
            <a href="" className='text-[24px]'><FaInstagram/></a>
            <a href="" className='text-[24px]'><FaLinkedin/></a>
          </div>
          <div>
            logo
          </div>
        </div>
      </footer>
    )
}