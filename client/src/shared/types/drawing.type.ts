/* @TODO */
export type Drawpoint = {
  x: number,
  y: number,
  strokeWidth: number,
  color: string,
  isEraser?: boolean;
}

export type Point = {
  x: number,
  y: number
}

export type DrawStroke = {
  socketId: string,
  points: Point[],
  strokeWidth: number, 
  color: string,
  isEraser?: boolean; 
}