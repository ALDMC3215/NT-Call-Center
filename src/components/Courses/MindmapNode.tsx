import { Handle, Position, NodeProps } from '@xyflow/react';

export const MindmapNode = ({ data, selected }: NodeProps) => {
  return (
    <div
      className={`px-5 py-3 shadow-md border-2 transition-all duration-200 flex items-center justify-center font-extrabold text-[14px] md:text-[15px] text-slate-800 tracking-wide`}
      style={{
        backgroundColor: data.color as string,
        borderColor: selected ? '#3b82f6' : 'transparent',
        borderRadius: '16px',
        minWidth: '120px',
        opacity: data.isFaded ? 0.5 : 1, // Optional: for highlighting
        fontFamily: 'var(--app-font), sans-serif',
      }}
      dir="rtl"
    >
      <Handle
        type="target"
        position={Position.Right}
        style={{ opacity: 0 }}
      />
      
      {data.label as string}

      <Handle
        type="source"
        position={Position.Left}
        style={{ opacity: 0 }}
      />
    </div>
  );
};
