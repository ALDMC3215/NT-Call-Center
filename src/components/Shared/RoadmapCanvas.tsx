import React, { useState, useRef, MouseEvent, WheelEvent, TouchEvent } from 'react';
import { useLocale } from '../../hooks/useLocale';

export interface NodeDef {
  id: string;
  title: string;
  step?: number | string;
  x: number;
  y: number;
  isRoot?: boolean;
}

export interface EdgeDef {
  from: string;
  to: string;
}

interface RoadmapCanvasProps {
  nodes: NodeDef[];
  edges: EdgeDef[];
  rootIcon?: React.ReactNode;
}

export const RoadmapCanvas = ({ nodes, edges, rootIcon }: RoadmapCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { tr, direction } = useLocale();

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    // Zoom behavior
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.5, transform.scale + delta), 2);
      
      setTransform(prev => ({ ...prev, scale: newScale }));
    } else {
      // Pan behavior for wheel (e.g., trackpad)
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Touch support for mobile pan
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setTouchStart({ x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y });
    }
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setTransform(prev => ({
      ...prev,
      x: e.touches[0].clientX - touchStart.x,
      y: e.touches[0].clientY - touchStart.y
    }));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Draw lines
  const renderEdges = () => {
    return edges.map((edge, idx) => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return null;

      // Calculate path
      const fromX = fromNode.x;
      const fromY = fromNode.y + (fromNode.isRoot ? 35 : 22); // node half heights approx
      const toX = toNode.x;
      const toY = toNode.y - (toNode.isRoot ? 35 : 22);

      // Bezier curve for smooth connection
      const cY1 = fromY + (toY - fromY) / 2;
      const cY2 = fromY + (toY - fromY) / 2;

      return (
        <path
          key={idx}
          d={`M ${fromX} ${fromY} C ${fromX} ${cY1}, ${toX} ${cY2}, ${toX} ${toY}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2.5"
          strokeDasharray="4 4"
        />
      );
    });
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-[600px] md:h-[700px] bg-[#f8fafc] relative overflow-hidden cursor-grab active:cursor-grabbing rounded-xl border border-slate-200"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ touchAction: 'none' }}
      dir={direction}
    >
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${transform.x}px ${transform.y}px`,
        }}
      />
      
      <div 
        className="absolute top-0 left-0 origin-top-left transition-transform duration-75 ease-out"
        style={{ 
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          width: '800px',
          height: '1000px',
          left: '50%',
          marginLeft: '-400px'
        }}
        dir="ltr" // internal graph layout LTR to keep x/y math simple
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {renderEdges()}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            className={`absolute flex flex-col items-center justify-center shadow-sm transition-all hover:shadow-md select-none ${
              node.isRoot 
                ? 'bg-slate-800 text-white rounded-xl px-6 py-4 border-2 border-slate-900 z-10'
                : 'bg-white text-slate-800 rounded-lg px-5 py-3 border border-slate-200 z-10 hover:border-slate-300 hover:-translate-y-0.5'
            }`}
            style={{ 
              left: `${node.x}px`, 
              top: `${node.y}px`,
              transform: 'translate(-50%, -50%)',
              width: node.isRoot ? '240px' : '180px'
            }}
          >
            {node.isRoot && rootIcon && (
              <div className="mb-2 text-slate-300">
                {rootIcon}
              </div>
            )}
            
            <span className={`font-bold ${node.isRoot ? 'text-[15px]' : 'text-[14px]'}`} dir={direction}>
              {node.title}
            </span>
            
            {!node.isRoot && node.step && (
              <div className="absolute -top-3 -right-3 w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-[13px] border-2 border-white shadow-sm">
                {node.step}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-5 right-5 bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-medium text-slate-600 shadow-sm pointer-events-none z-50 flex items-center gap-2">
        <div className="w-4 h-4 border border-slate-300 rounded-sm bg-slate-100 flex items-center justify-center text-[8px] font-bold">⌘</div>
        <span>{tr('برای جابه‌جایی کلیک کنید و بکشید (Scroll برای زوم)', 'Click and drag to pan (Scroll to zoom)')}</span>
      </div>
    </div>
  );
};
