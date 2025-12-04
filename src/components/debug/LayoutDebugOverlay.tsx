/**
 * Layout Debug Overlay
 * 
 * Shows real-time layout measurements in the app.
 * Enable by adding ?debug=layout to the URL or setting window.__DEBUG_LAYOUT__ = true
 */

import React, { useEffect, useState, useCallback } from 'react';

interface LayoutMeasurement {
  name: string;
  height: number;
  top: number;
  bottom: number;
  position: string;
  display: string;
  flex: string;
}

interface DebugData {
  viewport: { width: number; height: number };
  elements: LayoutMeasurement[];
  spaceBelow: number;
  timestamp: number;
}

const LayoutDebugOverlay: React.FC = () => {
  const [data, setData] = useState<DebugData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const measureLayout = useCallback(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    const elements: LayoutMeasurement[] = [];
    
    const measureEl = (selector: string, name: string) => {
      const el = document.querySelector(selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      elements.push({
        name,
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        position: style.position,
        display: style.display,
        flex: style.flex || 'none',
      });
    };
    
    measureEl('html', 'html');
    measureEl('body', 'body');
    measureEl('#root', '#root');
    measureEl('.app-container', '.app-container');
    measureEl('header', 'header');
    measureEl('form', 'form');
    measureEl('textarea', 'textarea');
    
    // Find input section (last flex-shrink-0 in main area)
    const form = document.querySelector('form');
    const spaceBelow = form ? vh - form.getBoundingClientRect().bottom : -1;
    
    setData({
      viewport: { width: vw, height: vh },
      elements,
      spaceBelow: Math.round(spaceBelow),
      timestamp: Date.now(),
    });
  }, []);

  useEffect(() => {
    // Check if debug mode should be enabled
    const urlParams = new URLSearchParams(window.location.search);
    const debugEnabled = urlParams.get('debug') === 'layout' || 
                         (window as any).__DEBUG_LAYOUT__ === true;
    
    if (!debugEnabled) return;
    
    setIsVisible(true);
    
    // Measure immediately and on interval
    measureLayout();
    const interval = setInterval(measureLayout, 500);
    
    // Also measure on resize
    window.addEventListener('resize', measureLayout);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', measureLayout);
    };
  }, [measureLayout]);

  if (!isVisible || !data) return null;

  const hasSpaceIssue = data.spaceBelow > 20;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          top: '4px',
          right: '4px',
          zIndex: 99999,
          background: hasSpaceIssue ? '#ff4444' : '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '10px',
          fontFamily: 'monospace',
        }}
      >
        📐 {hasSpaceIssue ? `⚠️ ${data.spaceBelow}px` : 'OK'}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.95)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '9px',
        padding: '4px',
        zIndex: 99999,
        maxHeight: '35%',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontWeight: 'bold' }}>📐 Layout Debug</span>
        <button
          onClick={() => setIsMinimized(true)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          ➖
        </button>
      </div>
      
      <div>
        <b>Viewport:</b> {data.viewport.width}x{data.viewport.height}
      </div>
      
      <div style={{ marginTop: '4px' }}>
        <b>Elements:</b>
        {data.elements.map((el, i) => (
          <div key={i} style={{ marginLeft: '8px' }}>
            <span style={{ color: '#88f' }}>{el.name}</span>: 
            h={el.height}, top={el.top}, bot={el.bottom}
            <span style={{ color: '#888' }}> | {el.position}, flex={el.flex}</span>
          </div>
        ))}
      </div>
      
      <div 
        style={{ 
          marginTop: '8px', 
          padding: '4px', 
          background: hasSpaceIssue ? '#500' : '#050',
          borderRadius: '4px',
        }}
      >
        <b style={{ color: hasSpaceIssue ? '#f88' : '#8f8' }}>
          SPACE BELOW INPUT: {data.spaceBelow}px
          {hasSpaceIssue && ' ⚠️ ISSUE DETECTED'}
        </b>
      </div>
      
      <div style={{ marginTop: '4px', color: '#666', fontSize: '8px' }}>
        Updated: {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default LayoutDebugOverlay;

// Export a function to enable debug from console
if (typeof window !== 'undefined') {
  (window as any).enableLayoutDebug = () => {
    (window as any).__DEBUG_LAYOUT__ = true;
    console.log('Layout debug enabled. Refresh the page to see the overlay.');
  };
}
