type DebuggerProps = {
  children?: object;
}

export const Debugger = ({ children }: DebuggerProps) => { 
  return (
    <details>
      <summary className="text-xs cursor-pointer mb-2">Debug info</summary>
      <div className="p-4 border">
        <h2 className="text-lg font-bold mb-2">Debugger</h2>
        <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
          {JSON.stringify(children, null, 2)}
      </pre>
      </div>
    </details>
  );
}