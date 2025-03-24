import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface ImageDisplayProps {
  image: {
    id: string
    url: string
    caption: string
    altText: string
    x_position?: number
    y_position?: number
    width?: number
    height?: number
    textStyle?: {
      isBold: boolean,
      color: string,
      backgroundColor: string,
      textAlign?: string,
      shadow?: string
    }
  }
  onUpdate: (updatedImage: any) => void
  onDelete: (imageId: string) => void
  onApplyToAll?: (style: any) => void
  index: number
}

export function ImageDisplay({ image, onUpdate, onDelete, onApplyToAll, index }: ImageDisplayProps) {
  const [position, setPosition] = useState({ 
    x: image.x_position || 0, 
    y: image.y_position || 0 
  })
  const [size, setSize] = useState({ 
    width: image.width || 360, 
    height: image.height || 240 
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionText, setCaptionText] = useState(image.caption || "")
  const [textStyle, setTextStyle] = useState(image.textStyle || {
    isBold: false,
    color: "#000000",
    backgroundColor: "#f9fafb",
    textAlign: "left",
    shadow: "0 2px 4px rgba(0,0,0,0.05)"
  })
  const cardRef = useRef<HTMLDivElement>(null)

  // Save position and size changes
  useEffect(() => {
    onUpdate({
      ...image,
      x_position: position.x,
      y_position: position.y,
      width: size.width,
      height: size.height,
      textStyle,
      caption: captionText
    })
  }, [position, size, textStyle, captionText, image, onUpdate])

  // Handle image dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left mouse button
    
    if ((e.target as HTMLElement).classList.contains('resize-handle') || 
        (e.target as HTMLElement).classList.contains('edit-text-btn')) {
      // Don't start dragging if clicking on resize handle or edit button
      return
    }
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    
    e.preventDefault()
  }
  
  // Handle image resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY
    })
    e.stopPropagation()
    e.preventDefault()
  }

  // Mouse movement handlers for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        })
      }
      
      if (isResizing && cardRef.current) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        
        setSize({
          width: Math.max(150, size.width + deltaX),
          height: Math.max(100, size.height + deltaY)
        })
        
        setDragStart({
          x: e.clientX,
          y: e.clientY
        })
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, position, size])

  // Handle caption editing
  const handleEditCaption = () => {
    setEditingCaption(true)
  }
  
  const handleCaptionBlur = () => {
    setEditingCaption(false)
  }

  // Toggle bold text
  const toggleBold = () => {
    setTextStyle({
      ...textStyle,
      isBold: !textStyle.isBold
    })
  }

  // Change text color
  const changeTextColor = (color: string) => {
    setTextStyle({
      ...textStyle,
      color
    })
  }

  // Change background color
  const changeBackgroundColor = (backgroundColor: string) => {
    setTextStyle({
      ...textStyle,
      backgroundColor,
      shadow: `0 4px 8px ${backgroundColor}`
    })
  }

  return (
    <div 
      ref={cardRef}
      className="absolute"
      style={{ 
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging || isResizing || showTextEditor ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      <Card 
        className="w-full h-full border border-[#ddd] rounded-xl overflow-hidden hover:shadow"
        style={{ 
          boxShadow: textStyle.shadow || '0 2px 4px rgba(0,0,0,0.05)' 
        }}
      >
        <div className="relative w-full h-3/4">
          <Image
            src={image.url}
            alt={image.altText || `Image ${index + 1}`}
            layout="fill"
            objectFit="cover"
            draggable={false}
            className="select-none"
            onError={(e) => {
              console.error("Failed to load image:", image.url);
              // Set fallback image on error
              (e.target as HTMLImageElement).src = "https://via.placeholder.com/360x240?text=Image+Error";
            }}
          />

          {/* Edit text button */}
          <button
            className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 w-6 h-6 flex items-center justify-center cursor-pointer z-10 hover:bg-opacity-100 transition-all edit-text-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowTextEditor(!showTextEditor)
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          
          {/* Delete button */}
          <button
            className="absolute top-2 left-2 bg-white bg-opacity-80 rounded-full p-1 w-6 h-6 flex items-center justify-center cursor-pointer z-10 hover:bg-opacity-100 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(image.id)
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        
        {/* Caption */}
        <CardContent 
          className="p-3 h-1/4 overflow-auto relative"
          style={{ backgroundColor: textStyle.backgroundColor }}
        >
          {editingCaption ? (
            <input
              type="text"
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              onBlur={handleCaptionBlur}
              autoFocus
              className="w-full bg-transparent outline-none text-sm"
              style={{ 
                color: textStyle.color,
                fontWeight: textStyle.isBold ? 'bold' : 'normal',
              }}
            />
          ) : (
            <p 
              className={`text-sm leading-relaxed ${textStyle.isBold ? 'font-bold' : 'font-medium'} cursor-text`}
              style={{ 
                color: textStyle.color,
                textAlign: textStyle.textAlign as "left" | "center" | "right" | "justify" | undefined
              }}
              onClick={handleEditCaption}
            >
              {captionText || "Double-click to add caption"}
            </p>
          )}
        </CardContent>
        
        {/* Resize handle */}
        <div 
          className="absolute bottom-0 right-0 cursor-se-resize resize-handle"
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '20px',
            height: '20px',
            background: 'linear-gradient(135deg, transparent 14px, rgba(200, 200, 200, 0.3) 15px)',
            cursor: 'se-resize'
          }}
        />
      </Card>

      {/* Text editor popup */}
      {showTextEditor && (
        <>
          {/* Overlay for closing when clicking outside */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowTextEditor(false)}
          />
        
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg rounded-md z-50 p-5 border border-gray-200" 
            style={{ width: '320px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bold and text alignment controls */}
            <div className="flex flex-wrap items-center mb-4 w-full">
              <div className="grid grid-cols-4 gap-2 w-full">
                {/* Bold button */}
                <div className="flex items-center justify-center">
                  <button 
                    className={`w-10 h-10 rounded-md flex items-center justify-center ${textStyle.isBold ? 'bg-blue-100 border-blue-400 border' : 'bg-gray-100'}`}
                    onClick={toggleBold}
                  >
                    <span className="font-bold text-lg">B</span>
                  </button>
                </div>
                
                {/* Text alignment buttons */}
                <div className="flex items-center justify-center">
                  <button 
                    className={`w-10 h-10 rounded-md flex items-center justify-center ${textStyle.textAlign === 'left' ? 'bg-blue-100 border-blue-400 border' : 'bg-gray-100'}`}
                    onClick={() => setTextStyle({...textStyle, textAlign: 'left'})}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="17" y1="10" x2="3" y2="10"></line>
                      <line x1="21" y1="6" x2="3" y2="6"></line>
                      <line x1="21" y1="14" x2="3" y2="14"></line>
                      <line x1="17" y1="18" x2="3" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center justify-center">
                  <button 
                    className={`w-10 h-10 rounded-md flex items-center justify-center ${textStyle.textAlign === 'center' ? 'bg-blue-100 border-blue-400 border' : 'bg-gray-100'}`}
                    onClick={() => setTextStyle({...textStyle, textAlign: 'center'})}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="10" x2="6" y2="10"></line>
                      <line x1="21" y1="6" x2="3" y2="6"></line>
                      <line x1="21" y1="14" x2="3" y2="14"></line>
                      <line x1="18" y1="18" x2="6" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center justify-center">
                  <button 
                    className={`w-10 h-10 rounded-md flex items-center justify-center ${textStyle.textAlign === 'right' ? 'bg-blue-100 border-blue-400 border' : 'bg-gray-100'}`}
                    onClick={() => setTextStyle({...textStyle, textAlign: 'right'})}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="21" y1="10" x2="7" y2="10"></line>
                      <line x1="21" y1="6" x2="3" y2="6"></line>
                      <line x1="21" y1="14" x2="3" y2="14"></line>
                      <line x1="21" y1="18" x2="7" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Text color */}
            <div className="space-y-1 mb-4">
              <span className="text-xs text-gray-500">Text color</span>
              <div className="relative w-full h-24 mb-2">
                <div 
                  id="colorSlider"
                  className="w-full h-full rounded-md overflow-hidden cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, red, orange, yellow, lime, cyan, blue, violet, magenta)`
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    const slider = e.currentTarget;
                    const rect = slider.getBoundingClientRect();
                    
                    const updateColor = (clientX: number) => {
                      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                      const hue = (x / rect.width) * 360;
                      const color = `hsl(${hue}, 100%, 50%)`;
                      changeTextColor(color);
                    };
                    
                    updateColor(e.clientX);
                    
                    const handlePointerMove = (moveEvent: PointerEvent) => {
                      moveEvent.preventDefault();
                      updateColor(moveEvent.clientX);
                    };
                    
                    const handlePointerUp = () => {
                      document.removeEventListener("pointermove", handlePointerMove);
                      document.removeEventListener("pointerup", handlePointerUp);
                    };
                    
                    document.addEventListener("pointermove", handlePointerMove);
                    document.addEventListener("pointerup", handlePointerUp);
                  }}
                />
              </div>
            </div>
            
            {/* Background color */}
            <div className="space-y-1 mb-4">
              <span className="text-xs text-gray-500">Background</span>
              <div className="relative w-full h-16 mb-2">
                <div 
                  id="bgColorSlider"
                  className="w-full h-full rounded-md overflow-hidden cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #fce4ec, #f3e5f5, #e8eaf6, #e3f2fd, #e0f7fa, #e0f2f1, #e8f5e9, #f1f8e9, 
                      #f9fbe7, #fffde7, #fff8e1, #fff3e0, #fbe9e7, #ffebee)`
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    const slider = e.currentTarget;
                    const rect = slider.getBoundingClientRect();
                    
                    const updateColor = (clientX: number) => {
                      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                      const hue = (x / rect.width) * 360;
                      const color = `hsl(${hue}, 70%, 90%)`;
                      changeBackgroundColor(color);
                    };
                    
                    updateColor(e.clientX);
                    
                    const handlePointerMove = (moveEvent: PointerEvent) => {
                      moveEvent.preventDefault();
                      updateColor(moveEvent.clientX);
                    };
                    
                    const handlePointerUp = () => {
                      document.removeEventListener("pointermove", handlePointerMove);
                      document.removeEventListener("pointerup", handlePointerUp);
                    };
                    
                    document.addEventListener("pointermove", handlePointerMove);
                    document.addEventListener("pointerup", handlePointerUp);
                  }}
                />
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col space-y-3 mt-4">
              <button 
                className="w-full text-sm bg-gray-100 hover:bg-gray-200 rounded-md p-2 transition-colors"
                onClick={() => setShowTextEditor(false)}
              >
                Close
              </button>
              
              {onApplyToAll && (
                <button 
                  className="w-full text-sm bg-[#5b06be] hover:bg-[#4a05a2] text-white rounded-md p-2 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof onApplyToAll === 'function') {
                      onApplyToAll(textStyle);
                      setShowTextEditor(false);
                    }
                  }}
                >
                  Apply to all images
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
