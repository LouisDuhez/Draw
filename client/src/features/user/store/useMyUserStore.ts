import { create } from 'zustand'
import type { User } from '../../../shared/types/user.type';

type UserState = {
  myUser: User | null;
}

type UserAction = {
  setMyUser: (user: User | null) => void,
  resetMyUser: () => void
};

export const useMyUserStore = create<UserState & UserAction>((set) => ({
  myUser: null,
  setMyUser: (user) => set({ myUser: user }),
  resetMyUser: () => set({ myUser: null }),
}));