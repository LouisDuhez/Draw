type DrawPoint = {
  x: number; // Float between 0 and 1
  y: number; // Float between 0 and 1
}

type DrawStroke = {
  userId: string;
  points: DrawPoint[];
  color: string;
  strokeWidth: number;
  isComplete: boolean;
  timestamp: number;
}

let activeStrokes: Map<string, DrawStroke> = new Map();
let completedStrokes: DrawStroke[] = [];

// Timer pour le nettoyage automatique
let cleanupTimer: NodeJS.Timeout | null = null;

// Démarrer le nettoyage automatique des anciens traits
export const startAutomaticCleanup = (intervalMinutes: number = 60, maxAgeHours: number = 24): void => {
  // Arrêter le timer existant s'il y en a un
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }

  const intervalMs = intervalMinutes * 60 * 1000; // Ce calcul convertit le temps en millisecondes
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000; // Ce calcul convertit le temps en millisecondes
  
  cleanupTimer = setInterval(() => {
    cleanupOldStrokes(maxAgeMs);
  }, intervalMs);
  
  console.log(`Automatic cleanup started: every ${intervalMinutes} minutes, removing strokes older than ${maxAgeHours} hours`);
};

// Arrêter le nettoyage automatique
export const stopAutomaticCleanup = (): void => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log('⏹️ Automatic cleanup stopped');
  }
};

// Ajouter un nouveau trait de dessin
export const addDrawStroke = (userId: string, startPoint: DrawPoint, color: string, strokeWidth: number): DrawStroke => {
  const stroke: DrawStroke = {
    userId,
    points: [startPoint],
    color,
    strokeWidth,
    isComplete: false,
    timestamp: Date.now()
  };
  
  activeStrokes.set(userId, stroke);
  console.log('-> New draw stroke started', { userId, startPoint, color, strokeWidth });
  
  return stroke;
};

// Mettre à jour un trait de dessin existant
export const updateDrawStroke = (userId: string, newPoint: DrawPoint): DrawStroke | null => {
  const stroke = activeStrokes.get(userId);
  
  if (!stroke) {
    console.warn('No active stroke found for user', { userId });
    return null;
  }
  
  stroke.points.push(newPoint);
  console.log('-> Draw stroke updated', { userId, newPoint, totalPoints: stroke.points.length });
  
  return stroke;
};

// Compléter un trait de dessin
export const completeDrawStroke = (userId: string): DrawStroke | null => {
  const stroke = activeStrokes.get(userId);
  
  if (!stroke) {
    console.warn('No active stroke found for user', { userId });
    return null;
  }
  
  stroke.isComplete = true;
  activeStrokes.delete(userId);
  completedStrokes.push(stroke);
  
  console.log('✅ Draw stroke completed', { userId, totalPoints: stroke.points.length });
  
  return stroke;
};

// Obtenir tous les traits actifs
export const getActiveStrokes = (): DrawStroke[] => {
  return Array.from(activeStrokes.values());
};

// Obtenir tous les traits complétés
export const getCompletedStrokes = (): DrawStroke[] => {
  return completedStrokes;
};

// Obtenir tous les traits existants (actifs + complétés)
export const getAllStrokes = (): DrawStroke[] => {
  return [...getActiveStrokes(), ...getCompletedStrokes()];
};

// Nettoyer les anciens traits pour alléger la mémoire 
export const cleanupOldStrokes = (maxAge: number = 3600000): void => { // 1 heure par défaut
  const now = Date.now();
  
  completedStrokes = completedStrokes.filter(stroke => {
    return (now - stroke.timestamp) < maxAge;
  });
  console.log('Old strokes cleaned up');
};

// Réinitialiser tout le dessin
export const clearAllStrokes = (): void => {
  activeStrokes.clear();
  completedStrokes = [];
  console.log('All strokes cleared');
};