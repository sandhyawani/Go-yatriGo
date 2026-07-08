import React from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause } from 'lucide-react';

const StorySticker = ({ 
  sticker, 
  mode = "viewer", 
  onRemove, 
  onUpdate, 
  onLocationClick, 
  onMusicClick, 
  isPlaying, 
  onPlayToggle,
  previewRef,
  onTextClick
}) => {
  const isEdit = mode === "edit";

  const content = (
    <div className={`relative group flex items-center justify-center min-w-max min-h-max p-2 ${!isEdit ? 'drop-shadow-lg' : ''}`}>
      {isEdit && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove && onRemove(sticker.id); }}
          className="absolute -top-1 -right-1 bg-rose-500 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {isEdit && (
        <div className="absolute -bottom-4 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
          Drag to move • Scroll to resize
        </div>
      )}

      {sticker.type === 'text' && (
        <div 
          onClick={() => isEdit && onTextClick && onTextClick()}
          className={`px-4 py-1.5 ${isEdit ? 'cursor-pointer' : ''} ${sticker.style?.bg === 'glass' ? 'bg-black/40 backdrop-blur-md rounded-2xl border border-white/10' : sticker.style?.bg === 'solid' ? 'bg-white text-slate-900 rounded-2xl shadow-xl' : ''}`}
          style={{ fontFamily: sticker.style?.font, color: sticker.style?.bg === 'solid' && sticker.style?.color === '#ffffff' ? '#000000' : sticker.style?.color, textAlign: sticker.style?.align }}
        >
          <p className="whitespace-pre-wrap text-4xl font-bold drop-shadow-md leading-tight">{sticker.text}</p>
        </div>
      )}

      {sticker.type === 'location' && (
        <div 
          onClick={() => isEdit && onLocationClick && onLocationClick()}
          className={`bg-white/90 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg border border-white/20 ${isEdit ? 'cursor-pointer' : ''}`}
        >
          <span className="text-rose-500 text-lg">📍</span>
          <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{sticker.text || sticker.emoji || "Location"}</span>
        </div>
      )}

      {sticker.type === 'emoji' && (
        <div className="text-7xl drop-shadow-xl select-none leading-none">{sticker.emoji || sticker.text || "😊"}</div>
      )}

      {sticker.type === 'music' && (
        <div 
          onClick={() => isEdit && onMusicClick && onMusicClick()}
          className={`bg-white/95 backdrop-blur-xl p-2.5 rounded-full flex items-center gap-3 min-w-[160px] max-w-[200px] border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.15)] ${isEdit ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 shrink-0">
            <span className="text-sm">🎵</span>
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-[12px] font-black text-slate-800 truncate">{sticker.data?.songTitle}</p>
            <p className="text-[10px] font-bold text-slate-500 truncate">{sticker.data?.artistName}</p>
          </div>
          {isEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayToggle && onPlayToggle();
              }}
              className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-white bg-primary-600 shadow-md transition-transform active:scale-95 ml-1"
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-[1px]" />}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (isEdit) {
    return (
      <motion.div
        drag
        dragConstraints={previewRef}
        dragElastic={0.1}
        dragMomentum={false}
        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing inline-flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-50"
        style={{
          left: `${typeof sticker.xPercent === 'number' && !isNaN(sticker.xPercent) ? sticker.xPercent : 50}%`,
          top: `${typeof sticker.yPercent === 'number' && !isNaN(sticker.yPercent) ? sticker.yPercent : 50}%`,
          x: 0,
          y: 0,
          scale: sticker.scale || 1,
        }}
        onDragEnd={(e, info) => {
          if (previewRef && previewRef.current) {
            const rect = previewRef.current.getBoundingClientRect();
            const deltaXPercent = (info.offset.x / rect.width) * 100;
            const deltaYPercent = (info.offset.y / rect.height) * 100;
            const currentXPercent = typeof sticker.xPercent === 'number' && !isNaN(sticker.xPercent) ? sticker.xPercent : 50;
            const currentYPercent = typeof sticker.yPercent === 'number' && !isNaN(sticker.yPercent) ? sticker.yPercent : 50;
            
            onUpdate(sticker.id, {
              xPercent: Math.max(0, Math.min(parseFloat((currentXPercent + deltaXPercent).toFixed(2)), 100)),
              yPercent: Math.max(0, Math.min(parseFloat((currentYPercent + deltaYPercent).toFixed(2)), 100)),
            });
          }
        }}
        onWheel={(e) => {
          const scaleChange = e.deltaY * -0.001;
          onUpdate(sticker.id, { scale: Math.max(0.5, Math.min(sticker.scale + scaleChange, 3)) });
        }}
      >
        {content}
      </motion.div>
    );
  }

  // Viewer mode
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="absolute inline-flex flex-col items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2"
      style={{ 
        left: `${typeof sticker.xPercent === 'number' && !isNaN(sticker.xPercent) ? sticker.xPercent : (typeof sticker.x === 'number' && !isNaN(sticker.x) ? sticker.x : 50)}%`, 
        top: `${typeof sticker.yPercent === 'number' && !isNaN(sticker.yPercent) ? sticker.yPercent : (typeof sticker.y === 'number' && !isNaN(sticker.y) ? sticker.y : 50)}%`, 
        scale: sticker.scale || 1
      }}
    >
      {content}
    </motion.div>
  );
};

export default StorySticker;
