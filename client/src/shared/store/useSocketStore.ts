import { create } from 'zustand'

type SocketState = {
  isConnectedToServer: boolean;
}

type SocketAction = {
  setIsConnectedToServer: (isConnectedToServer: boolean) => void;
};

export const useSocketStore = create<SocketState & SocketAction>((set) => ({
  isConnectedToServer: false,
  setIsConnectedToServer: (isConnectedToServer: boolean) => set({ isConnectedToServer }),
}));