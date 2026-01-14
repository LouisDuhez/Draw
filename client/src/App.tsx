import DrawPage from './pages/DrawPage';
import { useSocketStore } from './shared/store/useSocketStore';

function App() {
  const { isConnectedToServer } = useSocketStore();

  if (!isConnectedToServer) {
    return <div className="w-full min-h-screen flex items-center justify-center font-bold">Connecting to server...</div>
  }

  return (
    <DrawPage />
  )
}

export default App
