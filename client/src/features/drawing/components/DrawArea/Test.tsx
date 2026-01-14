import React, { useCallback, useRef, useEffect } from 'react';

export default function DrawArea() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);

    // ne mettre à jour que si nécessaire pour éviter de tout effacer inutilement
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // on applique une transform pour pouvoir dessiner en "CSS pixels"
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  }, []);

  // Dessin d'un cercle centré sur la position du clic (coordonnées CSS)
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // focus / sélection
    canvas.focus();
    try {
      (e.currentTarget as HTMLCanvasElement).setPointerCapture((e as any).pointerId);
    } catch {}

    // s'assurer que le canvas est correctement dimensionné avant de dessiner
    setupCanvas();

    // position relative au canvas en pixels CSS
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = 6; // rayon réduit (pixels CSS)
    ctx.beginPath();
    ctx.fillStyle = 'green';
    // arc prend le centre (cssX, cssY) — le cercle sera centré correctement
    ctx.arc(cssX, cssY, radius, 0, Math.PI * 2);
    ctx.fill();

    // logs
    const dpr = window.devicePixelRatio || 1;
    console.log('click position (CSS pixels):', { x: cssX, y: cssY });
    console.log('click position (device pixels):', { x: Math.round(cssX * dpr), y: Math.round(cssY * dpr) });
  }, [setupCanvas]);

  // setup initial + resize
  useEffect(() => {
    setupCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => setupCanvas());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [setupCanvas]);

  return (
    <div className="draw-arena" style={{ width: '100%', height: '100%' }}>
      <canvas
        id="draw-canvas"
        ref={canvasRef}
        className="outline"
        tabIndex={0}
        aria-label="Zone de dessin"
        onMouseDown={onMouseDown}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
    </div>
  );
}