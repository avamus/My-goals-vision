"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ImageDisplay } from "./image-display"
import { ImageUploadSlot } from "./image-upload-slot"

export interface GalleryImage {
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

interface ImageGalleryProps {
  memberId?: string
  teamId?: string
  title?: string
}

export function ImageGallery({ memberId, teamId, title = "Vision in Action" }: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch images from API
  useEffect(() => {
    if (!memberId) {
      setLoading(false)
      return
    }

    const fetchImages = async () => {
      try {
        setLoading(true)
        console.log(`Fetching vision items for member: ${memberId}`)
        const response = await fetch(`/api/vision-board?memberId=${memberId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch vision board items')
        }
        
        const data = await response.json()
        console.log("Fetched vision items:", data)
        
        // Map API data to gallery image format
        const galleryImages = data.map((item: any) => ({
          id: item.id.toString(),
          url: item.image_url,
          caption: item.text || "",
          altText: item.text || `Vision board image ${item.id}`,
          x_position: item.x_position || 0, 
          y_position: item.y_position || 0,
          width: item.width || 360, 
          height: item.height || 240,
          textStyle: {
            isBold: item.is_bold || false,
            color: item.text_color || "#000000",
            backgroundColor: item.background_color || "#f9fafb",
            textAlign: item.text_align || "left",
            shadow: "0 2px 4px rgba(0,0,0,0.05)"
          }
        }))
        
        setImages(galleryImages)
      } catch (err) {
        console.error("Error fetching images:", err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [memberId])

  const handleImageUpdate = async (updatedImage: GalleryImage) => {
    try {
      // First update local state for immediate feedback
      setImages(prevImages => prevImages.map(img => 
        img.id === updatedImage.id ? updatedImage : img
      ))
      
      // Then update in the API
      if (memberId) {
        // Convert the GalleryImage format to API format
        const apiData = {
          id: parseInt(updatedImage.id),
          memberstack_id: memberId,
          team_id: teamId,
          text: updatedImage.caption,
          text_color: updatedImage.textStyle?.color,
          background_color: updatedImage.textStyle?.backgroundColor,
          is_bold: updatedImage.textStyle?.isBold,
          text_align: updatedImage.textStyle?.textAlign,
          x_position: updatedImage.x_position,
          y_position: updatedImage.y_position,
          width: updatedImage.width,
          height: updatedImage.height
        }
        
        const response = await fetch('/api/vision-board', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        })

        if (!response.ok) {
          throw new Error('Failed to update image')
        }
      }
    } catch (err) {
      console.error("Error updating image:", err)
      setError((err as Error).message)
    }
  }

  const handleImageDelete = async (imageId: string) => {
    try {
      // First update local state
      setImages(prevImages => prevImages.filter(img => img.id !== imageId))
      
      // Then delete from the API
      if (memberId) {
        const response = await fetch(`/api/vision-board?id=${imageId}&memberId=${memberId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete image')
        }
      }
    } catch (err) {
      console.error("Error deleting image:", err)
      setError((err as Error).message)
    }
  }

  const handleApplyStyleToAll = async (style: any) => {
    try {
      // Update all images locally
      const updatedImages = images.map(img => ({
        ...img,
        textStyle: { ...style }
      }))
      
      setImages(updatedImages)
      
      // Update all images in the API
      if (memberId) {
        // This would be more efficient with a batch update endpoint
        // For now, we'll update each image individually
        const updatePromises = updatedImages.map(img => 
          fetch('/api/vision-board', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: parseInt(img.id),
              memberstack_id: memberId,
              team_id: teamId,
              text_color: style.color,
              background_color: style.backgroundColor,
              is_bold: style.isBold,
              text_align: style.textAlign
            }),
          })
        )
        
        await Promise.all(updatePromises)
      }
    } catch (err) {
      console.error("Error applying style to all images:", err)
      setError((err as Error).message)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!memberId) {
      setError('You need to be logged in to add images')
      return
    }
    
    try {
      setLoading(true)
      console.log("Uploading file:", file.name)
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string
        console.log("File converted to data URL")
        
        // Send image to API
        const response = await fetch('/api/vision-board', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberstack_id: memberId,
            team_id: teamId,
            image_url: imageUrl,
            x_position: Math.random() * 300,
            y_position: Math.random() * 200,
            width: 360,
            height: 240,
            z_index: images.length + 1
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to upload image')
        }
        
        const newItem = await response.json()
        console.log("New item created:", newItem)
        
        // Add new image to the local state
        const newImage: GalleryImage = {
          id: newItem.id.toString(),
          url: newItem.image_url,
          caption: "",
          altText: "New vision board image",
          x_position: newItem.x_position, 
          y_position: newItem.y_position,
          width: newItem.width, 
          height: newItem.height,
          textStyle: {
            isBold: false,
            color: "#000000",
            backgroundColor: "#f9fafb",
            textAlign: "left",
            shadow: "0 2px 4px rgba(0,0,0,0.05)"
          }
        }
        
        setImages(prevImages => [...prevImages, newImage])
        setLoading(false)
      }
      
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error uploading image:", err)
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <Card className="border border-[#ddd] rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-2xl font-bold text-black">{title}</span>
          </div>
        </div>
      </CardHeader>
      
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
          <button 
            className="ml-2 text-red-900 font-bold" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b06be]"></div>
          </div>
        ) : (
          <>
            {images.length === 0 ? (
              <ImageUploadSlot onUpload={handleImageUpload} />
            ) : (
              <Card className="border border-[#ddd] rounded-xl">
                <CardContent className="p-0">
                  <div className="relative h-[550px] w-full bg-gray-50 overflow-hidden">
                    {images.map((image, index) => (
                      <ImageDisplay
                        key={image.id}
                        image={image}
                        onUpdate={handleImageUpdate}
                        onDelete={handleImageDelete}
                        onApplyToAll={handleApplyStyleToAll}
                        index={index}
                      />
                    ))}
                    
                    {/* Add image button */}
                    <div className="absolute bottom-4 right-4">
                      <button 
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files
                            if (files && files.length > 0) {
                              handleImageUpload(files[0])
                            }
                          }
                          input.click()
                        }}
                        className="bg-[#5b06be] hover:bg-[#4a05a2] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
