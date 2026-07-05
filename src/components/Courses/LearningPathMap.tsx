import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { initialNodes, initialEdges } from '../../data/learningPathsData';
import { MindmapNode } from './MindmapNode';
import { customToast as toast } from '../UI/toast';
import * as Icons from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  mindmap: MindmapNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // LR means Left to Right
  dagreGraph.setGraph({ rankdir: direction, align: 'DL', ranksep: 200, nodesep: 40 });

  nodes.forEach((node) => {
    // Estimating dimensions for dagre
    dagreGraph.setNode(node.id, { width: 160, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - 70, // half width
      y: nodeWithPosition.y - 20, // half height
    };

    return node;
  });

  return { nodes, edges };
};

const COLORS = {
  root: '#c7c2ff',
  level1: '#c4d7f5',
  level2: '#b8e3d6',
  level3: '#b1f0c2',
};

const getColorByDepth = (depth: number) => {
  if (depth === 0) return COLORS.root;
  if (depth === 1) return COLORS.level1;
  if (depth === 2) return COLORS.level2;
  return COLORS.level3;
};

const MindmapFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const { fitView, getNodes, getEdges } = useReactFlow();

  // Load from local storage or defaults
  useEffect(() => {
    const savedNodes = localStorage.getItem('mindmap_nodes');
    const savedEdges = localStorage.getItem('mindmap_edges');
    
    let loadedNodes = initialNodes;
    let loadedEdges = initialEdges;

    if (savedNodes && savedEdges) {
      try {
        loadedNodes = JSON.parse(savedNodes);
        loadedEdges = JSON.parse(savedEdges);
      } catch (e) {
        console.error('Failed to parse saved mindmap data', e);
      }
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      loadedNodes,
      loadedEdges,
      'LR'
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    // Slight delay to allow nodes to render before fitting view
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [setNodes, setEdges, fitView]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } } as any, eds));
    },
    [setEdges],
  );

  const saveToLocal = (currentNodes: Node[], currentEdges: Edge[]) => {
    localStorage.setItem('mindmap_nodes', JSON.stringify(currentNodes));
    localStorage.setItem('mindmap_edges', JSON.stringify(currentEdges));
  };

  const handleSave = () => {
    saveToLocal(nodes, edges);
    toast.success('نقشه راه با موفقیت ذخیره شد.');
    setEditMode(false);
  };

  const handleReset = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'LR'
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    localStorage.removeItem('mindmap_nodes');
    localStorage.removeItem('mindmap_edges');
    toast.success('نقشه راه به حالت اولیه بازگردانی شد.');
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const handleNodeClick = (_: any, node: Node) => {
    if (!editMode) return;
    setSelectedNode(node);
    setEditLabel(node.data.label as string);
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  const updateNodeLabel = () => {
    if (!selectedNode) return;
    const newNodes = nodes.map((n) => {
      if (n.id === selectedNode.id) {
        n.data = { ...n.data, label: editLabel };
      }
      return n;
    });
    setNodes(newNodes);
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: editLabel } });
  };

  const addNode = () => {
    if (!selectedNode) {
      toast.error('ابتدا یک گره را به عنوان والد انتخاب کنید');
      return;
    }

    const parentDepth = (selectedNode.data.level as number) || 0;
    const newDepth = parentDepth + 1;
    const newNodeId = `node-${uuidv4()}`;
    
    const newNode: Node = {
      id: newNodeId,
      type: 'mindmap',
      position: { x: selectedNode.position.x + 200, y: selectedNode.position.y }, // rough placement before relayout
      data: {
        label: 'گره جدید',
        level: newDepth,
        color: getColorByDepth(newDepth)
      }
    };

    const newEdge: Edge = {
      id: `e-${selectedNode.id}-${newNodeId}`,
      source: selectedNode.id,
      target: newNodeId,
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 1.5 }
    };

    const updatedNodes = [...nodes, newNode];
    const updatedEdges = [...edges, newEdge];
    
    // Automatically relayout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(updatedNodes, updatedEdges, 'LR');
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    
    // Collect all descendants to delete them too
    const nodesToDelete = new Set<string>();
    const collectDescendants = (nodeId: string) => {
      nodesToDelete.add(nodeId);
      const children = edges.filter(e => e.source === nodeId).map(e => e.target);
      children.forEach(child => collectDescendants(child));
    };
    
    collectDescendants(selectedNode.id);
    
    const remainingNodes = nodes.filter(n => !nodesToDelete.has(n.id));
    const remainingEdges = edges.filter(e => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target));
    
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(remainingNodes, remainingEdges, 'LR');
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setSelectedNode(null);
    
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const onLayout = useCallback(
    () => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        'LR'
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    },
    [nodes, edges, setNodes, setEdges, fitView]
  );

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-50 font-[YekanBakh]">
      {editMode && (
        <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-200 w-[300px]" dir="rtl">
          <h3 className="font-extrabold text-[15px] mb-4 text-slate-800 border-b border-slate-100 pb-2">ویرایش نقشه راه</h3>
          
          {selectedNode ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[12px] font-bold text-slate-500 mb-1 block">نام گره:</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-medium outline-none focus:border-brand-500"
                  />
                  <button onClick={updateNodeLabel} className="bg-brand-500 text-white p-2 rounded-xl hover:bg-brand-600 transition-colors">
                    <Icons.Check size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  onClick={addNode}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 py-2 rounded-xl text-[12px] font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Icons.Plus size={14} />
                  زیرشاخه جدید
                </button>
                <button 
                  onClick={deleteNode}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-200 py-2 rounded-xl text-[12px] font-bold hover:bg-rose-100 transition-colors"
                >
                  <Icons.Trash2 size={14} />
                  حذف گره
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-[13px] py-4 bg-slate-50 rounded-xl border border-slate-100">
              برای ویرایش، روی یکی از گره‌ها کلیک کنید.
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
             <div className="flex gap-2">
               <button onClick={onLayout} className="flex-1 flex items-center justify-center gap-1 text-[12px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition-colors">
                 <Icons.LayoutGrid size={14} />
                 مرتب‌سازی
               </button>
               <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1 text-[12px] font-bold text-white bg-slate-800 hover:bg-slate-900 py-2 rounded-xl transition-colors shadow-sm">
                 <Icons.Save size={14} />
                 ذخیره
               </button>
             </div>
             <button onClick={handleReset} className="w-full flex items-center justify-center gap-1 text-[12px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2 rounded-xl transition-colors">
               <Icons.RotateCcw size={14} />
               بازگردانی به حالت اولیه
             </button>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        className="bg-slate-50"
        nodesDraggable={editMode}
        nodesConnectable={editMode}
        elementsSelectable={editMode}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        {!editMode && (
          <Panel position="top-right" className="m-4">
             <button 
               onClick={() => setEditMode(true)}
               className="flex items-center gap-2 bg-white text-brand-600 border border-brand-200 shadow-sm hover:shadow-md hover:bg-brand-50 px-4 py-2.5 rounded-2xl font-bold text-[13px] transition-all"
               dir="rtl"
             >
               <Icons.Settings2 size={16} />
               شخصی‌سازی مسیرها
             </button>
          </Panel>
        )}
        <Controls showInteractive={false} className="bg-white border-slate-200 rounded-xl shadow-sm overflow-hidden" />
      </ReactFlow>
    </div>
  );
};

export const LearningPathMap = () => {
  return (
    <ReactFlowProvider>
      <MindmapFlow />
    </ReactFlowProvider>
  );
};
