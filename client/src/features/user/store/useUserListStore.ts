import { create } from 'zustand'
import type { User } from '../../../shared/types/user.type';

type UserState = {
  userList: User[];
}

type UserAction = {
  setUserList: (users: User[]) => void,
};

export const useUserListStore = create<UserState & UserAction>((set) => ({
  userList: [],
  setUserList: (userList) => set({ userList })
}));