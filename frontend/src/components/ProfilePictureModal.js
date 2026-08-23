import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  RefreshCw, 
  Sparkles, 
  Check, 
  Loader2, 
  Image as ImageIcon, 
  Smile, 
  Dice5,
  Camera,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { toast } from 'sonner';
import api from '../lib/api';
import Avatar, { isEmojiAvatar, parseEmojiAvatar } from './Avatar';

// Curated PC & Gaming Component-Themed Emojis
export const PC_EMOJI_LIST = [
  '🖥️', '💻', '⌨️', '🖱️', '🎮', '🕹️', '💾', '💿', 
  '🔌', '🔋', '⚙️', '🧩', '🖲️', '📱', '🧑‍💻', '👾', 
  '🤖', '🎧', '🎙️', '⚡', '🚀', '🛡️', '🔥', '📦', 
  '💎', '🎯', '🛠️', '🔧', '📡', '🧠', '⭐', '🏆',
  '📀', '💡', '🕹️', '💽', '🏎️', '🔮', '🕹️', '🤖'
];

// Deduplicated unique emojis
export const UNIQUE_PC_EMOJIS = Array.from(new Set(PC_EMOJI_LIST));

// Curated theme gradient styles for emoji backgrounds
export const EMOJI_BG_THEMES = [
  { id: 'violet', name: 'Violet Neon', class: 'from-violet-600/30 to-indigo-600/30 border-violet-500/40 text-violet-300' },
  { id: 'cyan', name: 'Cyber Cyan', class: 'from-cyan-600/30 to-blue-600/30 border-cyan-500/40 text-cyan-300' },
  { id: 'emerald', name: 'Matrix Green', class: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/40 text-emerald-300' },
  { id: 'amber', name: 'RGB Amber', class: 'from-amber-600/30 to-orange-600/30 border-amber-500/40 text-amber-300' },
  { id: 'rose', name: 'Laser Rose', class: 'from-rose-600/30 to-pink-600/30 border-rose-500/40 text-rose-300' },
  { id: 'slate', name: 'Stealth Dark', class: 'from-zinc-800/80 to-zinc-950/90 border-zinc-700/60 text-zinc-200' },
  { id: 'fuchsia', name: 'Synthwave', class: 'from-fuchsia-600/30 to-purple-600/30 border-fuchsia-500/40 text-fuchsia-300' }
];

export default function ProfilePictureModal({
  isOpen,
  onClose,
  currentUser,
  onAvatarUpdated
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'emoji'
  const [saving, setSaving] = useState(false);

  // --- Image Upload & Crop State ---
  const [imageSrc, setImageSrc] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);

  // --- Emoji State ---
  const [selectedEmoji, setSelectedEmoji] = useState('🎮');
  const [selectedBgTheme, setSelectedBgTheme] = useState(EMOJI_BG_THEMES[0].class);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSaving(false);
      if (currentUser?.avatar && isEmojiAvatar(currentUser.avatar)) {
        setActiveTab('emoji');
        const parsed = parseEmojiAvatar(currentUser.avatar);
        setSelectedEmoji(parsed.emoji);
        setSelectedBgTheme(parsed.bgClass);
      } else {
        setActiveTab('upload');
      }
      setImageSrc(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    }
  }, [isOpen, currentUser]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WebP, AVIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  // Reset Crop State
  const handleResetCrop = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Zoom Helpers
  const handleZoomChange = (newZoom) => {
    setZoom(Math.min(Math.max(newZoom, 1), 3));
  };

  // Pan / Drag Handlers with Pointer Events
  const handlePointerDown = (e) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture?.(e.pointerId);
  };

  // Wheel Zoom on Viewport
  const handleWheel = (e) => {
    if (!imageSrc) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoomChange(zoom + delta);
  };

  // Generate Cropped Image on Canvas
  const generateCroppedBlob = () => {
    return new Promise((resolve, reject) => {
      if (!imageRef.current) {
        return reject(new Error('Image not loaded'));
      }

      const img = imageRef.current;
      const cropSize = 512; // Standard 512x512 avatar
      const canvas = document.createElement('canvas');
      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      // Fill with smooth background or keep transparent for PNGs
      ctx.clearRect(0, 0, cropSize, cropSize);

      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Transform canvas origin to center for rotation, scale, and pan
      ctx.translate(cropSize / 2, cropSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Calculate scale relative to viewport
      const viewportSize = 220; // Viewport width/height in px
      const scaleFactor = cropSize / viewportSize;
      
      const scaledPanX = pan.x * scaleFactor;
      const scaledPanY = pan.y * scaleFactor;
      ctx.translate(scaledPanX, scaledPanY);
      ctx.scale(zoom, zoom);

      // Draw the image centered
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawWidth, drawHeight;

      if (imgAspect >= 1) {
        drawHeight = cropSize;
        drawWidth = cropSize * imgAspect;
      } else {
        drawWidth = cropSize;
        drawHeight = cropSize / imgAspect;
      }

      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas blob generation failed'));
          }
        },
        'image/webp',
        0.92
      );
    });
  };

  // Random PC Emoji Picker
  const handleRandomEmoji = () => {
    const randomEmoji = UNIQUE_PC_EMOJIS[Math.floor(Math.random() * UNIQUE_PC_EMOJIS.length)];
    const randomTheme = EMOJI_BG_THEMES[Math.floor(Math.random() * EMOJI_BG_THEMES.length)].class;
    setSelectedEmoji(randomEmoji);
    setSelectedBgTheme(randomTheme);
  };

  // Save Profile Picture (Image or Emoji)
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (activeTab === 'upload') {
        if (!imageSrc) {
          toast.error('Please select an image first');
          setSaving(false);
          return;
        }

        const croppedBlob = await generateCroppedBlob();
        const file = new File([croppedBlob], imageFileName || 'avatar.webp', { type: 'image/webp' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'avatar');

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const avatarUrl = `${process.env.REACT_APP_BACKEND_URL || ''}${uploadRes.data.url}`;
        const profileRes = await api.put('/profile', { 
          avatar: avatarUrl,
          avatar_type: 'image',
          avatar_emoji: null
        });

        toast.success('Profile picture updated successfully!');
        if (onAvatarUpdated) onAvatarUpdated(profileRes.data.user || profileRes.data);
        onClose();
      } else {
        // Emoji avatar
        const avatarString = `emoji:${selectedEmoji}:${selectedBgTheme}`;
        const profileRes = await api.put('/profile', {
          avatar: avatarString,
          avatar_type: 'emoji',
          avatar_emoji: selectedEmoji
        });

        toast.success('Emoji avatar updated successfully!');
        if (onAvatarUpdated) onAvatarUpdated(profileRes.data.user || profileRes.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to update avatar:', err);
      toast.error(err.response?.data?.detail || 'Failed to update profile picture. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div 
        className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-500">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-base font-bold text-foreground">
                Update Profile Picture
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload a custom photo or pick a gaming component emoji
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors"
            data-testid="profile-modal-close-btn"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border px-6 pt-2 bg-muted/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-3 px-3 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-violet-600 text-violet-500 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-upload-photo"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Photo & Crop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`flex items-center gap-2 pb-3 px-3 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'emoji'
                ? 'border-violet-600 text-violet-500 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-choose-emoji"
          >
            <Smile className="w-4 h-4" />
            <span>PC & Gaming Emoji</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {!imageSrc ? (
                /* File Picker / Drop Area */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-violet-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-violet-500/5 group"
                  data-testid="avatar-dropzone"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    data-testid="avatar-file-input"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500 mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-sm text-foreground">Click to upload or drag image here</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WebP, AVIF (Max 10MB)</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl text-xs font-semibold pointer-events-none"
                  >
                    Choose Image File
                  </Button>
                </div>
              ) : (
                /* Interactive Circular Cropper */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-center bg-muted/20 p-4 rounded-2xl border border-border">
                    {/* Circular Cropping Viewport */}
                    <div className="flex flex-col items-center">
                      <div
                        ref={viewportRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onWheel={handleWheel}
                        className="relative w-[220px] h-[220px] rounded-full overflow-hidden border-2 border-violet-500 shadow-xl cursor-grab active:cursor-grabbing bg-black/40 touch-none select-none"
                        title="Drag to reposition, scroll to zoom"
                        data-testid="crop-viewport"
                      >
                        {/* Hidden image element for measurements */}
                        <img
                          ref={imageRef}
                          src={imageSrc}
                          alt="Crop Target"
                          style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                          }}
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                        />

                        {/* Circular Overlay Grid Guides */}
                        <div className="absolute inset-0 border border-white/20 rounded-full pointer-events-none" />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/15 pointer-events-none" />
                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/15 pointer-events-none" />
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-2">
                        🖱️ Drag to pan • Scroll to zoom
                      </span>
                    </div>

                    {/* Live Final Preview Card */}
                    <div className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-xl">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Live Preview</p>
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-500/50 shadow-md">
                        <img
                          src={imageSrc}
                          alt="Live Preview"
                          style={{
                            transform: `translate(${pan.x * (64 / 220)}px, ${pan.y * (64 / 220)}px) scale(${zoom}) rotate(${rotation}deg)`,
                            transformOrigin: 'center center'
                          }}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground mt-2">512×512 WebP</span>
                    </div>
                  </div>

                  {/* Crop Controls: Zoom & Rotate & Reset */}
                  <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-3">
                      <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="flex-1 accent-violet-600 cursor-pointer h-1.5 bg-muted rounded-lg"
                        data-testid="crop-zoom-slider"
                      />
                      <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-mono font-semibold w-10 text-right text-foreground">
                        {Math.round(zoom * 100)}%
                      </span>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                          className="h-8 px-2.5 text-xs rounded-lg gap-1.5"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Rotate</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResetCrop}
                          className="h-8 px-2.5 text-xs rounded-lg gap-1.5"
                          title="Reset Crop & Zoom"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 px-2.5 text-xs rounded-lg text-violet-500 hover:text-violet-400 gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Image</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Emoji Selection Tab */
            <div className="space-y-4">
              {/* Live Emoji Avatar Preview & Random Button */}
              <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl bg-gradient-to-br ${selectedBgTheme} border-2 border-violet-500/40 select-none animate-in zoom-in-95 duration-150`}>
                    <span>{selectedEmoji}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Selected Avatar</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">PC Component Emoji</p>
                    <span className="inline-block mt-1 text-[11px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                      {selectedEmoji}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRandomEmoji}
                  className="rounded-xl font-bold text-xs gap-1.5 border-violet-500/30 hover:bg-violet-500/10 text-violet-400 hover:text-violet-300"
                  data-testid="random-emoji-btn"
                >
                  <Dice5 className="w-4 h-4 text-violet-400 animate-pulse" />
                  <span>🎲 Random</span>
                </Button>
              </div>

              {/* Background Color Themes */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Avatar Background Style</Label>
                <div className="grid grid-cols-7 gap-2">
                  {EMOJI_BG_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedBgTheme(theme.class)}
                      className={`h-9 rounded-xl bg-gradient-to-br ${theme.class} border flex items-center justify-center transition-all ${
                        selectedBgTheme === theme.class
                          ? 'ring-2 ring-violet-500 scale-105 shadow-md'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={theme.name}
                    >
                      {selectedBgTheme === theme.class && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Grid Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Pick a Computer / Component Emoji</Label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 border border-border/60 rounded-xl bg-muted/10">
                  {UNIQUE_PC_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`h-11 rounded-xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                        selectedEmoji === emoji
                          ? 'bg-violet-600/20 border-2 border-violet-500 scale-110 shadow-md'
                          : 'hover:bg-muted border border-transparent hover:scale-105'
                      }`}
                    >
                      <span>{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl text-xs font-semibold"
            data-testid="profile-modal-cancel-btn"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || (activeTab === 'upload' && !imageSrc)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-md shadow-violet-600/20 gap-2"
            data-testid="profile-modal-save-btn"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Picture</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
