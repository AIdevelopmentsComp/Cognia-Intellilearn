'use client'
import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'


type Testimonial = {
  text: string
  author: string
  icon: JSX.Element
}

interface AutoCarouselProps {
  items: Testimonial[]
  speed?: number // píxeles por frame
}

export default function AutoCarousel({ items, speed = 1 }: AutoCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const scrollPositionRef = useRef(0) // acumulador decimal

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationId: number

    const scroll = () => {
      if (!container) return

      if (!isPaused) {
        scrollPositionRef.current += speed
        container.scrollLeft = Math.floor(scrollPositionRef.current)

        if (scrollPositionRef.current >= container.scrollWidth / 2) {
          scrollPositionRef.current = 0
          container.scrollLeft = 0
        }
      }

      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused, speed])

  return (
    <div
      className="w-[80vw] mx-auto overflow-x-scroll no-scrollbar px-4"
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex gap-6 w-max">
        {[...items, ...items].map((item, i) => (
          <div key={i} className="testimonialItem">
            <div>
              <p className="text-[16px] text-[#132944] text-start p-2.5">{item.text}</p>
              <p className="text-[16px] text-start pl-2 font-semibold text-[#132944]">{item.author}</p>
            </div>
            <div className="flex justify-end mb-4">
              <span className="icon-testimonial">{item.icon}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
