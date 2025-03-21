"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface LightboxProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt?: string
  onNext?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
  showDownload?: boolean
}

export function Lightbox({
  isOpen,
  onClose,
  src,
  alt = "Image",
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  showDownload = true,
}: LightboxProps) {
  const [scale, setScale] = React.useState(1)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
  
  // Reset zoom and position when image changes
  React.useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [src])

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale((prevScale) => {
      const newScale = Math.max(prevScale - 0.25, 0.5)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newScale
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "Escape":
        onClose()
        break
      case "ArrowLeft":
        if (hasPrevious && onPrevious) onPrevious()
        break
      case "ArrowRight":
        if (hasNext && onNext) onNext()
        break
      case "+":
        handleZoomIn()
        break
      case "-":
        handleZoomOut()
        break
      case "0":
        setScale(1)
        setPosition({ x: 0, y: 0 })
        break
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = src
    link.download = alt || "image"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogOverlay 
        className="bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <DialogContent 
        className="max-w-none max-h-screen w-full h-full p-0 border-0 bg-transparent"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            className={cn(
              "relative select-none",
              isDragging ? "cursor-grabbing" : scale > 1 ? "cursor-grab" : "cursor-default"
            )}
          >
            <img 
              src={src} 
              alt={alt} 
              className="max-h-[90vh] max-w-[90vw] object-contain"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s'
              }}
              draggable={false}
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="text-white h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
            >
              <ZoomOut className="h-4 w-4" />
              <span className="sr-only">Zoom out</span>
            </Button>
            <span className="text-white text-xs w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="text-white h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
            >
              <ZoomIn className="h-4 w-4" />
              <span className="sr-only">Zoom in</span>
            </Button>
            {showDownload && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleDownload}
                className="text-white h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download</span>
              </Button>
            )}
          </div>

          {/* Navigation */}
          {hasPrevious && onPrevious && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white h-10 w-10 rounded-full bg-black/50 hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous</span>
            </Button>
          )}
          
          {hasNext && onNext && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white h-10 w-10 rounded-full bg-black/50 hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next</span>
            </Button>
          )}

          
        </div>
      </DialogContent>
    </Dialog>
  )
} 