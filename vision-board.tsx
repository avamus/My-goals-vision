"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  X,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react"

type VisionItem = {
  id: number;
  image_url: string;
  text: string;
  text_color: string;
  background_color: string;
  width: number;
  height: number;
  x_position: number;
  y_position: number;
  is_bold?: boolean;
  text_align?: 'left' | 'center' | 'right';
  z_index: number;
}

interface VisionBoardProps {
  memberId?: string;
  teamId?: string;
}

export default function VisionBoard({ memberId, teamId }: VisionBoardProps) {
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [editingItem, setEditingItem] = useState<VisionItem | null>(null);
  const [editText, setEditText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [opacity, setOpacity] = useState(70);
  const [isBold, setIsBold] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [isDragging, setIsDragging] = useState(false);
  const [currentZIndex, setCurrentZIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<HTMLDivElement | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // Fetch vision board items on component mount
  useEffect(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    
    const fetchVisionItems = async () => {
      setLoading(true);
      try {
        console.log(`Fetching vision items for member: ${memberId}`);
        const response = await fetch(`/api/vision-board?memberId=${memberId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch vision board items');
        }
        
        const data = await response.json();
        console.log("Fetched vision items:", data);
        
        // Map data to the expected format
        const formattedItems = data.map((item: any) => ({
          id: item.id,
          image_url: item.image_url,
          text: item.text || "",
          text_color: item.text_color || "#FFFFFF",
          background_color: item.background_color || "rgba(0, 0, 0, 0.7)",
          width: item.width || 200,
          height: item.height || 150,
          x_position: item.x_position || 0,
          y_position: item.y_position || 0,
          is_bold: item.is_bold || false,
          text_align: item.text_align || 'center',
          z_index: item.z_index || 1
        }));
        
        setVisionItems(formattedItems);
        if (formattedItems.length > 0) {
          setCurrentZIndex(Math.max(...formattedItems.map(item => item.z_index)) + 1);
        }
      } catch (err) {
        console.error("Error fetching vision items:", err);
        setError((err as Error).message || 'An error occurred while loading your vision board');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVisionItems();
  }, [memberId]);
  
  // Handle click outside modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setEditingItem(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle mouse events for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragItemRef.current) return;
      
      const itemId = parseInt(dragItemRef.current?.dataset.id || "0");
      const item = visionItems.find(i => i.id === itemId);
      if (!item) return;
      
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (!boardRect) return;
      
      const newX = Math.max(0, Math.min(boardRect.width - item.width, item.x_position + dx));
      const newY = Math.max(0, Math.min(boardRect.height - item.height, item.y_position + dy));
      
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      
      setVisionItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, x_position: newX, y_position: newY } 
            : i
        )
      );
    };
    
    const handleMouseUp = async () => {
      if (isDragging && dragItemRef.current && memberId) {
        const itemId = parseInt(dragItemRef.current.dataset.id || "0");
        const item = visionItems.find(i => i.id === itemId);
        
        if (item) {
          try {
            await fetch('/api/vision-board', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: item.id,
                memberstack_id: memberId,
                team_id: teamId,
                x_position: item.x_position,
                y_position: item.y_position
              }),
            });
          } catch (err) {
            console.error("Error updating position:", err);
          }
        }
      }
      
      setIsDragging(false);
      dragItemRef.current = null;
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, visionItems, memberId, teamId]);
  
  const handleDragStart = (e: React.MouseEvent, item: VisionItem, element: HTMLDivElement) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Bring item to front
    setVisionItems(prev => 
      prev.map(i => 
        i.id === item.id 
          ? { ...i, z_index: currentZIndex + 1 } 
          : i
      )
    );
    setCurrentZIndex(prev => prev + 1);
    
    setIsDragging(true);
    dragItemRef.current = element;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  };
  
  const handleResize = (e: React.MouseEvent, item: VisionItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.width;
    const startHeight = item.height;
    const aspectRatio = startWidth / startHeight;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const newWidth = Math.max(100, startWidth + dx);
      const newHeight = newWidth / aspectRatio;
      
      setVisionItems(prev => 
        prev.map(i => 
          i.id === item.id 
            ? { ...i, width: newWidth, height: newHeight } 
            : i
        )
      );
    };
    
    const handleMouseUp = async () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (memberId) {
        const updatedItem = visionItems.find(i => i.id === item.id);
        if (updatedItem) {
          try {
            await fetch('/api/vision-board', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: updatedItem.id,
                memberstack_id: memberId,
                team_id: teamId,
                width: updatedItem.width,
                height: updatedItem.height
              }),
            });
          } catch (err) {
            console.error("Error updating size:", err);
          }
        }
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !memberId) {
      return;
    }

    const file = event.target.files[0];
    setLoading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        console.log("File converted to data URL");
        
        // Calculate position for new item
        let x = 10, y = 10;
        if (boardRef.current) {
          const rect = boardRef.current.getBoundingClientRect();
          x = Math.random() * (rect.width - 200);
          y = Math.random() * (rect.height - 150);
        }
        
        // Send image to API
        console.log("Posting new image");
        const response = await fetch('/api/vision-board', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            memberstack_id: memberId,
            team_id: teamId,
            image_url: imageUrl,
            x_position: x,
            y_position: y,
            width: 200,
            height: 150,
            z_index: currentZIndex + 1
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save image');
        }
        
        const newItem = await response.json();
        console.log("New item created:", newItem);
        
        const formattedItem: VisionItem = {
          id: newItem.id,
          image_url: newItem.image_url,
          text: newItem.text || "",
          text_color: newItem.text_color || "#FFFFFF",
          background_color: newItem.background_color || "rgba(0, 0, 0, 0.7)",
          width: newItem.width || 200,
          height: newItem.height || 150,
          x_position: newItem.x_position || x,
          y_position: newItem.y_position || y,
          is_bold: newItem.is_bold || false,
          text_align: (newItem.text_align as 'left' | 'center' | 'right') || 'center',
          z_index: newItem.z_index || (currentZIndex + 1)
        };
        
        setVisionItems(prev => [...prev, formattedItem]);
        setCurrentZIndex(prev => prev + 1);
        
        // Open text editor for the new item
        setEditingItem(formattedItem);
        setEditText("");
        setTextColor("#FFFFFF");
        setBackgroundColor("#000000");
        setOpacity(70);
        setIsBold(false);
        setTextAlign('center');
        
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
      
      // Reset input to allow selecting the same file again
      event.target.value = '';
      
    } catch (err) {
      console.error("Error uploading image:", err);
      setError((err as Error).message || 'Failed to save image');
      setLoading(false);
    }
  };
  
  const handleAddClick = () => {
    console.log("Add Vision button clicked");
    
    if (!memberId) {
      setError('You need to be logged in to add images to your vision board');
      return;
    }
    
    if (fileInputRef.current) {
      console.log("Triggering file input click");
      fileInputRef.current.click();
    } else {
      console.error("File input reference is null");
    }
  };
  
  const handleEditItem = (item: VisionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setEditingItem(item);
    setEditText(item.text || "");
    setIsBold(item.is_bold || false);
    setTextAlign(item.text_align || 'center');
    
    // Parse existing colors and opacity
    if (item.text_color) {
      setTextColor(item.text_color);
    }
    
    if (item.background_color && item.background_color.startsWith("rgba")) {
      const parts = item.background_color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (parts && parts.length === 5) {
        const [_, r, g, b, a] = parts;
        setBackgroundColor(`rgb(${r},${g},${b})`);
        setOpacity(parseFloat(a) * 100);
      } else {
        setBackgroundColor("#000000");
        setOpacity(70);
      }
    } else {
      setBackgroundColor(item.background_color || "#000000");
      setOpacity(70);
    }
  };
  
  const handleDeleteItem = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!memberId) return;
    
    try {
      const response = await fetch(`/api/vision-board?id=${id}&memberId=${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      setVisionItems(visionItems.filter(item => item.id !== id));
      if (editingItem?.id === id) {
        setEditingItem(null);
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      setError((err as Error).message || 'Failed to delete item');
    }
  };
  
  const handleSaveEdit = async () => {
    if (!editingItem || !memberId) return;
    
    // Convert background color and opacity
    const bgColor = backgroundColor.startsWith("#") 
      ? hexToRgb(backgroundColor) 
      : backgroundColor.replace("rgb(", "").replace(")", "");
    
    const rgbaBackground = `rgba(${bgColor}, ${opacity / 100})`;
    
    try {
      // First update local state optimistically
      const updatedItem = {
        ...editingItem,
        text: editText,
        text_color: textColor,
        background_color: rgbaBackground,
        is_bold: isBold,
        text_align: textAlign
      };
      
      setVisionItems(visionItems.map(item => 
        item.id === editingItem.id ? updatedItem : item
      ));
      
      // Then update in the API
      const response = await fetch('/api/vision-board', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingItem.id,
          memberstack_id: memberId,
          team_id: teamId,
          text: editText,
          text_color: textColor,
          background_color: rgbaBackground,
          is_bold: isBold,
          text_align: textAlign
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
    } catch (err) {
      console.error("Error updating item:", err);
      setError((err as Error).message || 'Failed to update item');
    } finally {
      setEditingItem(null);
    }
  };

  // Helper function to convert hex to rgb
  function hexToRgb(hex: string) {
    // Remove the # if it exists
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }

  return (
    <div className="rounded-[20px] bg-white p-6 pb-6 shadow-none border-[1px] border-[#ddd] mb-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://res.cloudinary.com/drkudvyog/image/upload/v1740700886/Interactie_vision_board_icon_r4a3hh.png" 
            alt="Interactive Vision Board Icon" 
            className="w-6 h-6"
          />
          <h1 className="text-2xl font-bold text-gray-900">Interactive Vision Board</h1>
        </div>
        
        <Button 
          onClick={handleAddClick}
          className="bg-[#5b06be] hover:bg-[#4c05a0] text-white rounded-full px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vision
        </Button>
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
          <button 
            className="ml-2 text-red-900 font-bold" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      <div 
        ref={boardRef}
        className="relative h-[400px] rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50"
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5b06be]"></div>
          </div>
        ) : visionItems.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              Add images that represent your vision and goals
            </p>
            <Button 
              onClick={handleAddClick}
              className="bg-[#5b06be] hover:bg-[#4c05a0] text-white rounded-full px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Image
            </Button>
          </div>
        ) : (
          visionItems.map((item) => (
            <div 
              key={item.id}
              data-id={item.id}
              className="absolute group cursor-move flex flex-col"
              style={{ 
                left: item.x_position,
                top: item.y_position,
                width: item.width,
                zIndex: item.z_index,
                touchAction: 'none'
              }}
              onMouseDown={(e) => handleDragStart(e, item, e.currentTarget)}
            >
              <div className="relative w-full" style={{ height: item.height }}>
                <img 
                  src={item.image_url} 
                  alt="Vision" 
                  className="w-full h-full object-cover rounded-lg"
                  draggable="false"
                  onError={(e) => {
                    console.error("Failed to load image:", item.image_url);
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x150?text=Image+Error";
                  }}
                />
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/30 p-1 rounded-lg backdrop-blur-sm">
                  <button 
                    onClick={(e) => handleEditItem(item, e)} 
                    className="text-white rounded-full p-1 hover:bg-white/20"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteItem(item.id, e)} 
                    className="text-white rounded-full p-1 hover:bg-white/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Resize handle */}
                <div 
                  className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResize(e, item)}
                >
                  <div className="w-3 h-3 border-r-2 border-b-2 border-white transform rotate-45 drop-shadow-md"></div>
                </div>
              </div>
              
              {/* Text below image */}
              {item.text && (
                <div 
                  className="mt-2 p-3 rounded-lg"
                  style={{ 
                    backgroundColor: item.background_color,
                    color: item.text_color,
                    fontWeight: item.is_bold ? 'bold' : 'normal',
                    textAlign: item.text_align || 'center'
                  }}
                >
                  <p className="text-sm">{item.text}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Text Editor Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Vision Description</h3>
                <Button 
                  onClick={() => setEditingItem(null)} 
                  className="text-gray-500 hover:text-gray-700 rounded-full w-8 h-8 p-0 bg-gray-100 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mb-5">
                <img 
                  src={editingItem.image_url} 
                  alt="Preview" 
                  className="w-full h-36 object-cover rounded-lg mb-3" 
                />
                
                <div className="flex items-center gap-1 mb-2">
                  <button
                    onClick={() => setIsBold(!isBold)}
                    className={`p-1.5 rounded ${isBold ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setTextAlign('left')}
                    className={`p-1.5 rounded ${textAlign === 'left' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setTextAlign('center')}
                    className={`p-1.5 rounded ${textAlign === 'center' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setTextAlign('right')}
                    className={`p-1.5 rounded ${textAlign === 'right' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
                
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Describe your vision..."
                  className={`w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5b06be] bg-white text-gray-700`}
                  style={{
                    fontWeight: isBold ? 'bold' : 'normal',
                    textAlign
                  }}
                  rows={3}
                />
              </div>
              
              <div className="mb-5 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Text color</p>
                  <div className="relative w-full h-10 rounded-lg overflow-hidden"
                       style={{ backgroundColor: textColor }}>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Background</p>
                  <div className="relative w-full h-10 rounded-lg overflow-hidden"
                       style={{ backgroundColor: backgroundColor }}>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center mt-2 gap-3">
                    <p className="text-sm font-medium text-gray-700 whitespace-nowrap">Opacity:</p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(parseInt(e.target.value))}
                      className="w-full accent-[#5b06be]"
                    />
                    <span className="text-sm text-gray-700 w-10">{opacity}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-white bg-[#5b06be] hover:bg-[#4c05a0] rounded-full"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
