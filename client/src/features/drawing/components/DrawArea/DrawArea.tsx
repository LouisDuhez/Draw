import { useCallback, useEffect, useMemo, useRef } from "react";
import { getCoordinatesRelativeToElement } from "../../utils/getCanvasCoordinates";
import { useMyUserStore } from "../../../user/store/useMyUserStore";
import { useDrawingStore } from "../../../user/store/useDrawingStore";
import styles from './DrawArea.module.css';
import { SocketManager } from "../../../../shared/services/SocketManager";
import type { DrawStroke, Point } from "../../../../shared/types/drawing.type";
export function DrawArea() {
  /**
   * SECTION 1 — ÉTAT & RÉFÉRENCES
   * - Refs pour éviter les re-render lors du dessin (performance)
   * - Stores (utilisateur, outil, couleur, épaisseur)
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const isDrawing = useRef(false);
  const lastCoordinates = useRef<{ x: number; y: number } | null>(null);
  const isEraser = useRef(false);
  const currentlyDrawingTraits = useRef<Set<string>>(new Set());

  // Taille CSS du canvas (référence pour ratios 0-1)
  const canvasSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const { myUser } = useMyUserStore();
  const { tool, color, strokeWidth } = useDrawingStore();

  // L’utilisateur peut-il dessiner ?
  const canUserDraw = useMemo(() => myUser !== null, [myUser]);

  // Synchroniser l’état gomme avec le store sans recréer les handlers
  useEffect(() => {
    isEraser.current = tool === 'eraser';
  }, [tool]);

  // Historique temporaire des traits des autres (en relatif 0-1)
  const otherUserStrokes = useRef<Map<string, Point[]>>(new Map());

  // Refs stables des options de dessin (accès dans callbacks)
  const colorRef = useRef<string>(color);
  const toolRef = useRef<typeof tool>(tool);
  const strokeWidthRef = useRef<number>(strokeWidth);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { strokeWidthRef.current = strokeWidth; }, [strokeWidth]);

  /**
   * SECTION 2 — COORDONNÉES (RELATIF/ABSOLU)
   * Convertit pixels <-> ratios pour un rendu identique malgré les tailles d’écran.
   */

  /**
   * toRelative
   * Entrée: point en pixels
   * Sortie: point en ratio (0-1) basé sur la taille CSS du canvas
   * Usage: avant envoi réseau
   */
  const toRelative = useCallback((point: { x: number, y: number }) => {
    if (canvasSize.current.width === 0 || canvasSize.current.height === 0) return point;
    return {
      x: point.x / canvasSize.current.width,
      y: point.y / canvasSize.current.height
    };
  }, []);

  /**
   * toAbsolute
   * Entrée: point en ratio (0-1)
   * Sortie: point en pixels selon la taille CSS courante
   * Usage: à la réception réseau et au resize
   */
  const toAbsolute = useCallback((point: { x: number, y: number }) => {
    return {
      x: point.x * canvasSize.current.width,
      y: point.y * canvasSize.current.height
    };
  }, []);

  /**
   * getCanvasCoordinates
   * Coordonnées souris relatives au canvas.
   */
  const getCanvasCoordinates = (e: MouseEvent | React.MouseEvent<HTMLCanvasElement>) => {
    return getCoordinatesRelativeToElement(e.clientX, e.clientY, canvasRef.current);
  };

  /**
   * getOptions
   * Calcule les options de style à partir du mode (gomme/stylo) et du store.
   */
  const getOptions = useCallback((isEraserMode: boolean) => {
    return {
      color: isEraserMode ? '#FFFFFF' : colorRef.current,
      width: strokeWidthRef.current,
    };
  }, []);

  /**
   * SECTION 3 — MOTEUR DE DESSIN (Canvas 2D)
   * Unique point d’accès au contexte 2D. Optimisé et pur.
   */

  /**
   * drawLine
   * Trace une ligne (courbe quadratique pour la fluidité) entre deux points.
   * - Gomme: utilise destination-out (efface réellement)
   * - Stylo: source-over (dessine par-dessus)
   */
  const drawLine = useCallback((
    from: { x: number; y: number },
    to: { x: number; y: number },
    options?: { color: string, width: number, isEraser?: boolean }
  ) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();

    if (options) {
      ctx.lineWidth = options.width;
      ctx.strokeStyle = options.color;
      ctx.globalCompositeOperation = options.isEraser ? 'destination-out' : 'source-over';
    }

    // Courbe quadratique (plus lisse). Dot si from == to.
    ctx.moveTo(from.x, from.y);
    if (from.x === to.x && from.y === to.y) {
      ctx.lineTo(to.x, to.y);
    } else {
      const cx = (from.x + to.x) / 2;
      const cy = (from.y + to.y) / 2;
      ctx.quadraticCurveTo(cx, cy, to.x, to.y);
    }
    ctx.stroke();

    // Toujours revenir en mode normal
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  /**
   * SECTION 4 — INPUTS UTILISATEUR (LOCAL)
   * Gestion souris: move, down, up
   */

  /**
   * onMouseMove
   * - Dessin immédiat en pixels (fluidité locale)
   * - Conversion en relatif et envoi Socket
   */
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing.current) return;

    const coordinates = getCanvasCoordinates(e);
    const from = lastCoordinates.current ?? coordinates;
    const options = getOptions(isEraser.current);

    // Rendu immédiat local
    drawLine(from, coordinates, { ...options, isEraser: isEraser.current });
    lastCoordinates.current = coordinates;

    // Envoi réseau (coordonnées relatives)
    const relativeCoords = toRelative(coordinates);
    SocketManager.emit('draw:move', {
      x: relativeCoords.x,
      y: relativeCoords.y,
      strokeWidth: options.width,
      color: options.color,
      isEraser: isEraser.current
    } as any);
  }, [drawLine, toRelative]);

  /**
   * onMouseUp
   * Fin du trait: reset local + notification Socket.
   */
  const onMouseUp = useCallback(() => {
    isDrawing.current = false;
    lastCoordinates.current = null;
    currentlyDrawingTraits.current.clear();
    SocketManager.emit('draw:end');
  }, []);

  /**
   * onMouseDown
   * Début du trait: init local, dot initial, envoi Socket, bind move/up.
   */
  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    if (!canUserDraw) return;

    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coordinates = getCanvasCoordinates(e);

    isDrawing.current = true;
    lastCoordinates.current = coordinates;

    // Point initial (clic immobile)
    const options = getOptions(isEraser.current);
    drawLine(coordinates, coordinates, { ...options, isEraser: isEraser.current });

    // Envoi du début de trait (relatif + style)
    const relativeCoords = toRelative(coordinates);
    SocketManager.emit('draw:start', {
      x: relativeCoords.x,
      y: relativeCoords.y,
      strokeWidth: options.width,
      color: options.color,
      isEraser: isEraser.current
    } as any);

    // Écoute du drag sur le canvas
    canvasRef.current?.addEventListener('mousemove', onMouseMove);
    canvasRef.current?.addEventListener('mouseup', onMouseUp);
  }, [canUserDraw, onMouseMove, onMouseUp, drawLine, toRelative]);

  /**
   * SECTION 5 — RESPONSIVE & DPR
   * Calcule et applique les dimensions canvas + scale DPR pour éviter le flou.
   */

  /**
   * setCanvasDimensions
   * - Calcule width/height (16:9)
   * - Met à l’échelle interne selon le DPR
   * - Configure le contexte (scale, lineCap, lineJoin)
   */
  const setCanvasDimensions = useCallback(() => {
    if (!canvasRef.current || !parentRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const parentWidth = parentRef.current.clientWidth;

    // Ratio 16/9
    const canvasWidth = parentWidth;
    const canvasHeight = Math.round(parentWidth * 9 / 16);

    // Référence pour conversions relatif/absolu
    canvasSize.current = { width: canvasWidth, height: canvasHeight };

    // Taille interne (pixels physiques)
    canvasRef.current.width = dpr * canvasWidth;
    canvasRef.current.height = dpr * canvasHeight;

    // Taille CSS (affichage)
    parentRef.current.style.setProperty('--canvas-width', `${canvasWidth}px`);
    parentRef.current.style.setProperty('--canvas-height', `${canvasHeight}px`);

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  /**
   * SECTION 6 — RENDU DISTANT (TEMPS RÉEL)
   * Dessine les points (relatifs) reçus du réseau après conversion.
   */

  /**
   * drawOtherUserPoints
   * Redessine une série de points (relatifs -> absolus) pour un socketId.
   * Stocke l’historique temporaire afin d’éviter les redessins inutiles.
   */
  const drawOtherUserPoints = useCallback((points: Point[], socketId?: string, options?: { color?: string; strokeWidth?: number; isEraser?: boolean }) => {
    const previousPoints = socketId ? otherUserStrokes.current.get(socketId) || [] : [];

    points.forEach((point, index) => {
      // Skip si déjà dessiné
      if (previousPoints[index]) return;

      // Conversion ratio -> pixels
      const to = toAbsolute(point);
      const prevPointRel = index === 0 ? point : points[index - 1];
      const from = toAbsolute(prevPointRel);

      const drawOptions = options ? {
        color: options.color || '#000000',
        width: options.strokeWidth || 2,
        isEraser: options.isEraser || false
      } : undefined;

      drawLine(from, to, drawOptions);
    });

    // Mémorise ce qui a été dessiné pour ce socketId
    if (socketId) {
      otherUserStrokes.current.set(socketId, points);
    }
  }, [drawLine, toAbsolute]);

  /**
   * Handlers Socket — Réception des événements
   */
  const onOtherUserDrawMove = useCallback((payload: DrawStroke) => {
    if (payload.socketId === SocketManager.socketId) return;
    const isEraserStroke = (payload as any).isEraser ?? false;
    drawOtherUserPoints(payload.points, payload.socketId, { color: payload.color, strokeWidth: payload.strokeWidth, isEraser: isEraserStroke });
  }, [drawOtherUserPoints]);

  const onOtherUserDrawStart = useCallback((payload: DrawStroke) => {
    if (payload.socketId === SocketManager.socketId) return;
    const isEraserStroke = (payload as any).isEraser ?? false;
    drawOtherUserPoints(payload.points, payload.socketId, { color: payload.color, strokeWidth: payload.strokeWidth, isEraser: isEraserStroke });
    otherUserStrokes.current.set(payload.socketId, payload.points);
  }, [drawOtherUserPoints]);

  const onOtherUserDrawEnd = useCallback((payload: DrawStroke) => {
    otherUserStrokes.current.delete(payload.socketId);
  }, []);

  const onCanvasReset = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    otherUserStrokes.current.clear();
  }, []);

  /**
   * SECTION 7 — CHARGEMENT & REDESSIN (RESIZE)
   * Recharge l’historique des traits et redessine après changement de dimensions.
   */

  /**
   * getAllStrokes
   * Vide le canvas puis redessine tout l’historique (ratio -> pixels).
   */
  const getAllStrokes = useCallback(() => {
    const loadStrokes = async () => {
      const ctx = canvasRef.current?.getContext('2d');
      if(ctx && canvasRef.current) {
         ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      const response = await SocketManager.get('strokes');
      const strokes = response?.strokes || [];
      if (!strokes.length) return;

      strokes.forEach(stroke => {
        if (!stroke.points || stroke.points.length === 0) return;
        const isEraserStroke = (stroke as any).isEraser ?? false;
        drawOtherUserPoints(stroke.points, stroke.socketId, { color: stroke.color, strokeWidth: stroke.strokeWidth, isEraser: isEraserStroke });
      });
    };
    loadStrokes();
  }, [drawOtherUserPoints]);

  /**
   * SECTION 8 — EFFETS (RESIZE OBSERVER, SOCKETS, INIT)
   */

  // Redessiner automatiquement au resize du conteneur
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setCanvasDimensions();
      getAllStrokes();
    });

    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [setCanvasDimensions, getAllStrokes]);

  // Écoute des événements sockets
  useEffect(() => {
    SocketManager.listen('draw:start', onOtherUserDrawStart);
    SocketManager.listen('draw:end', onOtherUserDrawEnd);
    SocketManager.listen('draw:move', onOtherUserDrawMove);
    SocketManager.listen('canvas:reset', onCanvasReset);

    return () => {
      SocketManager.off('draw:start');
      SocketManager.off('draw:end');
      SocketManager.off('draw:move');
      SocketManager.off('canvas:reset');
    }
  }, [onOtherUserDrawStart, onOtherUserDrawEnd, onOtherUserDrawMove, onCanvasReset]);

  // Initialisation (dimensions + premier rendu)
  useEffect(() => {
    setCanvasDimensions();
    getAllStrokes();
  }, [getAllStrokes, setCanvasDimensions]);

  return (
    <div className={[styles.drawArea, 'w-full', 'h-full', 'overflow-hidden', 'flex', 'items-center'].join(' ')} ref={parentRef}>
      <canvas
        className={[styles.drawArea__canvas, 'border-1'].join(' ')}
        onMouseDown={onMouseDown}
        ref={canvasRef}
      />
    </div>
  )
}