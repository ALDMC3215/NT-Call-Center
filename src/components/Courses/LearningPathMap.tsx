import React, { useMemo, useRef, useEffect } from 'react';
import { initialNodes, initialEdges, Node } from '../../data/learningPathsData';

interface TreeNode {
  node: Node;
  children: TreeNode[];
}

export const LearningPathMap = () => {
  const tree = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>();
    initialNodes.forEach(n => nodeMap.set(n.id, { node: n, children: [] }));
    
    initialEdges.forEach(edge => {
      const parent = nodeMap.get(edge.source);
      const child = nodeMap.get(edge.target);
      if (parent && child) {
        parent.children.push(child);
      }
    });
    
    return nodeMap.get('root');
  }, []);

  const renderTree = (treeNode: TreeNode) => {
    return (
      <li key={treeNode.node.id}>
        <div className="flex justify-center z-10 relative">
          <div 
            className="px-5 py-2.5 rounded-lg text-[13px] md:text-[14px] text-slate-700 bg-white border border-slate-300 whitespace-nowrap shadow-sm hover:border-slate-400 transition-colors"
            dir="rtl" // Ensure text inside cards is RTL
          >
            {treeNode.node.data.label}
          </div>
        </div>
        {treeNode.children.length > 0 && (
          <ul>
            {treeNode.children.map(child => renderTree(child))}
          </ul>
        )}
      </li>
    );
  };

  // Add drag-to-scroll functionality for better UX
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;

    let isDown = false;
    let startX: number;
    let startY: number;
    let scrollLeft: number;
    let scrollTop: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      slider.classList.add('cursor-grabbing');
      startX = e.pageX - slider.offsetLeft;
      startY = e.pageY - slider.offsetTop;
      scrollLeft = slider.scrollLeft;
      scrollTop = slider.scrollTop;
    };
    const onMouseLeave = () => {
      isDown = false;
      slider.classList.remove('cursor-grabbing');
    };
    const onMouseUp = () => {
      isDown = false;
      slider.classList.remove('cursor-grabbing');
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const y = e.pageY - slider.offsetTop;
      const walkX = (x - startX) * 2; // Scroll-fast
      const walkY = (y - startY) * 2;
      slider.scrollLeft = scrollLeft - walkX;
      slider.scrollTop = scrollTop - walkY;
    };

    slider.addEventListener('mousedown', onMouseDown);
    slider.addEventListener('mouseleave', onMouseLeave);
    slider.addEventListener('mouseup', onMouseUp);
    slider.addEventListener('mousemove', onMouseMove);

    return () => {
      slider.removeEventListener('mousedown', onMouseDown);
      slider.removeEventListener('mouseleave', onMouseLeave);
      slider.removeEventListener('mouseup', onMouseUp);
      slider.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div 
      ref={scrollRef}
      className="w-full h-full overflow-auto bg-slate-50 cursor-grab active:cursor-grabbing p-8 md:p-16 select-none" 
      dir="ltr" // LTR is crucial for the CSS tree lines to render correctly
    >
      <style dangerouslySetInnerHTML={{__html: `
        .org-tree {
          display: flex;
          justify-content: center;
        }
        .org-tree ul {
          display: flex;
          padding-top: 28px;
          position: relative;
          margin: 0;
          padding-left: 0;
          padding-right: 0;
        }
        .org-tree li {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding-top: 28px;
          padding-left: 10px;
          padding-right: 10px;
        }
        .org-tree ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 28px;
          background-color: #cbd5e1;
        }
        .org-tree li::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #cbd5e1;
        }
        .org-tree li:first-child::before {
          left: 50%;
        }
        .org-tree li:last-child::before {
          right: 50%;
        }
        .org-tree li:only-child::before {
          display: none;
        }
        .org-tree li::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 28px;
          background-color: #cbd5e1;
        }
        .org-tree li:only-child {
          padding-top: 0;
        }
        .org-tree li:only-child::after {
          display: none;
        }
        /* Root overrides */
        .org-tree > ul {
          padding-top: 0;
        }
        .org-tree > ul::before {
          display: none;
        }
      `}} />

      {/* w-max and mx-auto ensure it centers if small, but allows full scrolling if large, without clipping the left side */}
      <div className="w-max mx-auto pb-32 org-tree">
        {tree && (
          <ul>
            {renderTree(tree)}
          </ul>
        )}
      </div>
    </div>
  );
};
