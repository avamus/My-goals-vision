"use client"

import { useState, useRef } from "react"

interface ImageUploadSlotProps {
  onUpload: (file: File) => void
}

export function ImageUploadSlot({ onUpload }: ImageUploadSlotProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    console.log("File input change event triggered")
    
    if (e.target.files && e.target.files.length > 0) {
      console.log("Files selected:", e.target.files.length)
      handleFiles(e.target.files)
    } else {
      console.log("No files selected")
    }
  }

  const handleFiles = (files: FileList) => {
    console.log("Handling files:", files.length)
    setIsLoading(true)
    
    const file = files[0]
    
    if (file) {
      console.log("Processing file:", file.name, "Size:", file.size, "Type:", file.type)
      onUpload(file)
      // Let the parent component handle the loading state to avoid flashing UI
    } else {
      console.error("File is undefined")
      setIsLoading(false)
    }
  }

  const onButtonClick = () => {
    console.log("ImageUploadSlot clicked")
    if (fileInputRef.current) {
      console.log("Triggering file input click from slot")
      fileInputRef.current.click()
    } else {
      console.error("File input ref is null in ImageUploadSlot")
    }
  }

  return (
    <div 
      className={`aspect-[16/7.2] relative border-2 border-dashed ${dragActive ? 'border-[#5b06be] bg-purple-50' : 'border-gray-300'} 
        rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-400 transition-all`}
      onClick={onButtonClick}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      
      <div className="text-center p-4">
        {isLoading ? (
          <div className="animate-spin w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5b06be" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-full bg-purple-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5b06be" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Click to upload image</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            <p className="text-xs text-purple-600 mt-2">Drag and drop also supported</p>
          </>
        )}
      </div>
    </div>
  )
}
