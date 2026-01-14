import { useCallback, useEffect, useMemo, useRef } from "react";
import { getCoordinatesRelativeToElement } from "../../utils/getCanvasCoordinates";
import { useMyUserStore } from "../../../user/store/useMyUserStore";
import { useDrawingStore } from "../../../user/store/useDrawingStore";
import styles from './DrawArea.module.css';
import { SocketManager } from "../../../../shared/services/SocketManager";
import type { DrawStroke, Point } from "../../../../shared/types/drawing.type";

export function DrawArea() {
  /**
   * ===================
   * 1. STATE & REFS
   * ===================
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Ces refs gèrent l'état "muet" du dessin (pas de re-render React) pour la performance
  const isDrawing = useRef(false);
  const lastCoordinates = useRef<{ x: number; y: number } | null>(null);
  const isEraser = useRef(false);
  // Track les traits en cours de dessin pour ignorer leurs mises à jour serveur
  const currentlyDrawingTraits = useRef<Set<string>>(new Set());

  // Stocke la taille "CSS" du canvas. C'est la référence pour calculer les pourcentages (0-1).
  const canvasSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const { myUser } = useMyUserStore();
  const { tool, color } = useDrawingStore();
  
  // Mémorisation pour éviter de recalculer inutilement si l'utilisateur peut dessiner
  const canUserDraw = useMemo(() => myUser !== null, [myUser]);
  
  // Synchronisation : Quand le store (Zustand) change d'outil, on met à jour la ref interne
  // On utilise une ref pour que 'onMouseMove' y accède sans devoir être recréé à chaque changement.
  useEffect(() => {
    isEraser.current = tool === 'eraser';
  }, [tool]);
  
  // Stockage local des traits des autres utilisateurs (format relatif 0-1)
  // Sert à redessiner tout le canvas proprement lors d'un resize de fenêtre.
  const otherUserStrokes = useRef<Map<string, Point[]>>(new Map());
  
  // Références stables pour accéder aux valeurs actuelles du store dans les callbacks
  const colorRef = useRef<string>(color);
  const toolRef = useRef<typeof tool>(tool);
  
  // Mise à jour des refs quand le store change
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  /**
   * ===================
   * 2. SYSTÈME DE COORDONNÉES (Cœur de la logique responsive)
   * ===================
   */
  
  // 
  // INPUT: Pixels (ex: x=500 sur un écran de 1000px)
  // OUTPUT: Ratio (ex: x=0.5)
  // UTILISATION: Avant d'envoyer les données au serveur (Socket)
  const toRelative = useCallback((point: { x: number, y: number }) => {
    if (canvasSize.current.width === 0 || canvasSize.current.height === 0) return point;
    return {
      x: point.x / canvasSize.current.width,
      y: point.y / canvasSize.current.height
    };
  }, []);

  // INPUT: Ratio (ex: x=0.5)
  // OUTPUT: Pixels actuels (ex: x=250 si l'écran a été redimensionné à 500px)
  // UTILISATION: À la réception des données du serveur ou lors d'un resize
  const toAbsolute = useCallback((point: { x: number, y: number }) => {
    return {
      x: point.x * canvasSize.current.width,
      y: point.y * canvasSize.current.height
    };
  }, []);

  // Récupère la position de la souris relative au coin haut-gauche du canvas
  const getCanvasCoordinates = (e: MouseEvent | React.MouseEvent<HTMLCanvasElement>) => {
    return getCoordinatesRelativeToElement(e.clientX, e.clientY, canvasRef.current);
  }

  // Configuration dynamique du style du trait (Gomme = Gros et Blanc ou Transparent)
  const getOptions = useCallback((isEraserMode: boolean) => {
    return {
      color: isEraserMode ? '#FFFFFF' : colorRef.current,
      width: isEraserMode ? 20 : 2,
    };
  }, []);

  /**
   * ===================
   * 3. MOTEUR DE DESSIN (Engine)
   * ===================
   */
  
  // Cette fonction est le seul point d'entrée vers le contexte 2D.
  // Elle doit être pure et performante.
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
      
      // LOGIQUE GOMME : 
      // 'destination-out' rend les pixels transparents (efface vraiment le canvas).
      // 'source-over' est le mode par défaut (peint par dessus).
      if (options.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    
    // IMPORTANT : Toujours remettre en mode normal après un trait pour ne pas bugger les prochains dessins
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  /**
   * ===================
   * 4. GESTION DES INPUTS (Local User)
   * ===================
   */

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing.current) return;
    
    // A. Calcul immédiat en PIXELS pour une fluidité parfaite (zéro latence perçue)
    const coordinates = getCanvasCoordinates(e);
    const from = lastCoordinates.current ?? coordinates;
    const options = getOptions(isEraser.current);
    
    // B. Dessin visuel immédiat
    drawLine(from, coordinates, { ...options, isEraser: isEraser.current });
    lastCoordinates.current = coordinates;

    // C. Conversion en RELATIF (0-1) avant envoi réseau
    // Cela rend les données indépendantes de la taille d'écran de l'utilisateur
    const relativeCoords = toRelative(coordinates);

    SocketManager.emit('draw:move', {
      x: relativeCoords.x,
      y: relativeCoords.y,
      strokeWidth: options.width,
      color: options.color,
      isEraser: isEraser.current
    } as any);
  }, [drawLine, toRelative]);

  const onMouseUp = useCallback(() => {
    isDrawing.current = false;
    lastCoordinates.current = null;
    // On arrête d'ignorer nos traits du serveur une fois qu'on a fini de dessiner
    currentlyDrawingTraits.current.clear();
    SocketManager.emit('draw:end');
  }, []);

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    if (!canUserDraw) { return; }

    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coordinates = getCanvasCoordinates(e);
    
    // Ne pas appeler beginPath/moveTo ici, drawLine le fera
    isDrawing.current = true;
    lastCoordinates.current = coordinates;
    
    // Dessin du point initial (un clic sans bouger fait un point)
    const options = getOptions(isEraser.current);
    drawLine(coordinates, coordinates, { ...options, isEraser: isEraser.current });

    const relativeCoords = toRelative(coordinates);

    // Envoi du début de trait aux autres (avec les métadonnées de style)
    SocketManager.emit('draw:start', {
      x: relativeCoords.x,
      y: relativeCoords.y,
      strokeWidth: options.width,
      color: options.color,
      isEraser: isEraser.current
    } as any);

    // Ajout des listeners sur window ou canvas (canvasRef ici) pour suivre le drag
    canvasRef.current?.addEventListener('mousemove', onMouseMove);
    canvasRef.current?.addEventListener('mouseup', onMouseUp);
  }, [canUserDraw, onMouseMove, onMouseUp, drawLine, toRelative]);

  /**
   * ===================
   * 5. GESTION DE LA TAILLE (Responsive)
   * ===================
   */

  const setCanvasDimensions = useCallback(() => {
    if (!canvasRef.current || !parentRef.current) return;

    // Gestion des écrans Retina/4K (DPR > 1) pour éviter le flou
    const dpr = window.devicePixelRatio || 1;
    const parentWidth = parentRef.current.clientWidth;
    
    // Définition du ratio 16/9
    const canvasWidth = parentWidth;
    const canvasHeight = Math.round(parentWidth * 9 / 16);

    // Mise à jour de la référence pour les calculs de conversion
    canvasSize.current = { width: canvasWidth, height: canvasHeight };

    // Taille interne réelle (ex: 2000px pour un affichage CSS de 1000px si DPR=2)
    canvasRef.current.width = dpr * canvasWidth;
    canvasRef.current.height = dpr * canvasHeight;

    // Taille d'affichage CSS
    parentRef.current.style.setProperty('--canvas-width', `${canvasWidth}px`);
    parentRef.current.style.setProperty('--canvas-height', `${canvasHeight}px`);

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      // On scale le contexte pour que dessiner à (10,10) dessine en réalité à (20,20) sur écran retina
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  /**
   * ===================
   * 6. RENDU DISTANT (Multiplayer)
   * ===================
   */

  // Fonction utilitaire pour dessiner une série de points reçus
  const drawOtherUserPoints = useCallback((points: Point[], socketId?: string, options?: { color?: string; strokeWidth?: number; isEraser?: boolean }) => {
    const previousPoints = socketId ? otherUserStrokes.current.get(socketId) || [] : [];

    points.forEach((point, index) => {
      // Optimisation : Ne pas redessiner ce qui l'est déjà
      if (previousPoints[index]) return;

      // ÉTAPE CRUCIALE : Conversion Relatif (0.5) -> Absolu (500px)
      // C'est ici que l'adaptation à la taille de l'écran du récepteur se fait
      const to = toAbsolute(point);
      
      // Calcul du point de départ du trait
      const prevPointRel = index === 0 ? point : points[index - 1];
      const from = toAbsolute(prevPointRel);

      const drawOptions = options ? {
        color: options.color || '#000000',
        width: options.strokeWidth || 2,
        isEraser: options.isEraser || false
      } : undefined;

      drawLine(from, to, drawOptions);
    });
    
    // Stocker les points dessinés pour ne pas les redessiner
    if (socketId) {
      otherUserStrokes.current.set(socketId, points);
    }
  }, [drawLine, toAbsolute]);

  /**
   * Handlers Socket - Réception des données
   */
  const onOtherUserDrawMove = useCallback((payload: DrawStroke) => {
    // Ignorer nos propres traits (on les dessine déjà en local)
    if (payload.socketId === SocketManager.socketId) return;
    // Note : payload contient des coordonnées relatives (0-1)
    const isEraserStroke = (payload as any).isEraser ?? false;
    drawOtherUserPoints(payload.points, payload.socketId, { color: payload.color, strokeWidth: payload.strokeWidth, isEraser: isEraserStroke });
  }, [drawOtherUserPoints]);

  const onOtherUserDrawStart = useCallback((payload: DrawStroke) => {
    // Ignorer nos propres traits (on les dessine déjà en local)
    if (payload.socketId === SocketManager.socketId) return;
    const isEraserStroke = (payload as any).isEraser ?? false;
    drawOtherUserPoints(payload.points, payload.socketId, { color: payload.color, strokeWidth: payload.strokeWidth, isEraser: isEraserStroke });
    // On initialise l'historique pour ce socketId
    otherUserStrokes.current.set(payload.socketId, payload.points);
  }, [drawOtherUserPoints]);
  
  const onOtherUserDrawEnd = useCallback((payload: DrawStroke) => {
    // Nettoyage mémoire une fois le trait fini
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
   * 7. CHARGEMENT ET RESIZE
   * Cette fonction est critique pour le responsive : elle redessine tout.
   */
  const getAllStrokes = useCallback(() => {
    const loadStrokes = async () => {
      const ctx = canvasRef.current?.getContext('2d');
      // On efface tout le canvas car lors d'un resize, les pixels changent de place
      if(ctx && canvasRef.current) {
         ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      const response = await SocketManager.get('strokes');
      const strokes = response?.strokes || [];

      if (!strokes.length) return;

      // On redessine tout l'historique en utilisant les nouvelles dimensions (grâce à toAbsolute dans drawOtherUserPoints)
      strokes.forEach(stroke => {
        if (!stroke.points || stroke.points.length === 0) return;
        const isEraserStroke = (stroke as any).isEraser ?? false;
        drawOtherUserPoints(stroke.points, stroke.socketId, { color: stroke.color, strokeWidth: stroke.strokeWidth, isEraser: isEraserStroke });
      });
    };
    loadStrokes();
  }, [drawOtherUserPoints]);

  // Observer de redimensionnement de la fenêtre
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setCanvasDimensions(); // 1. Recalculer width/height
      getAllStrokes();       // 2. Redessiner tout avec les nouveaux ratios
    });
    
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [setCanvasDimensions, getAllStrokes]);

  // Initialisation des Sockets
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

  // Premier chargement
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