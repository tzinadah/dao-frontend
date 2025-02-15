import { FC, ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  children: ReactNode
  onClose: () => void
  width?: number
}
export const Modal: FC<Props> = ({ children, onClose, width, className }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 rounded-[8px]">
      <div
        className="fixed inset-0 backdrop-filter backdrop-blur-2xl transition-opacity"
        onClick={onClose}
      ></div>
      <div
        className={cn(
          'max-w-xl bg-background rounded-lg shadow-xl overflow-hidden transform transition-all border border-[#2D2D2D]',
          className,
        )}
        style={{ minWidth: width }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white text-[24px] rounded-full p-2">
          <Image src="/images/close-button.svg" width={24} height={24} alt="Close" />
        </button>
        {children}
      </div>
    </div>
  )
}
