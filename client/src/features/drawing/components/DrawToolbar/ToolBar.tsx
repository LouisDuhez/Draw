import { useDrawingStore } from "../../../user/store/useDrawingStore";
import { SocketManager } from "../../../../shared/services/SocketManager";

export function Toolbar() {
  const { tool, setTool, color, setColor, strokeWidth, setStrokeWidth } = useDrawingStore();

  const handleReset = () => {
    SocketManager.emit('canvas:reset');
  };

  return (
    <div className="flex gap-2 p-2 bg-white shadow rounded-lg border items-center">
      <button
        onClick={() => setTool('pen')}
        className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
      >
        Crayon
      </button>

      <button
        onClick={() => setTool('eraser')}
        className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
      >
        Gomme
      </button>
      {/*P1*/}
      {/* Couleur (visible avec le crayon) */}
      {tool === 'pen' && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Couleur:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 border rounded cursor-pointer"
          />
          <span className="text-sm text-gray-600">{color}</span>
        </div>
      )}
      {/*P2*/}
      {/* Épaisseur de tracé */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Épaisseur:</label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
        />
        <span className="text-sm text-gray-600">{strokeWidth}px</span>
      </div>

      <div className="w-px bg-gray-300"></div>

      <button
        onClick={handleReset}
        className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
      >
        Réinitialiser
      </button>
    </div>
  );
}