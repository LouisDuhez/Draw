export const getCoordinatesRelativeToElement = (x: number, y: number, element: HTMLElement | null) => {
  if (!element) return { x: 0, y: 0 };
  
  const rect = element.getBoundingClientRect();
  return {
    x: x - rect.left,
    y: y - rect.top
  };
}