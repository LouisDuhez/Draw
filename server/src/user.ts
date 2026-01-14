export type User = {
  username: string;
  avatar: string;
  hasDrawn?: boolean;
}

export type UserWithSocketId = {
  socketId: string
} & User;

export const users = new Map<string, User>();

export const getUsers = () => {
  return Array.from(users.values());
}

export const getUser = (id: UserWithSocketId['socketId']) => {
  return users.get(id);
}

export const addUser = (id: UserWithSocketId['socketId'], user: Partial<User>) => {
  const newUser = {
    username: user.username || 'Username',
    avatar: user.avatar || '',
    score: 0,
    hasDrawn: false,
    ...user,
    id,
    socketId: id,
  };
  users.set(id, newUser);

  return newUser;
}

export const removeUser = (id: UserWithSocketId['socketId']) => {
  const user = getUser(id);
  users.delete(id);

  return user;
}

export const editUser = (id: UserWithSocketId['socketId'], userUpdates: Partial<User>) => {
  const user = getUser(id);
  if (!user) {
    return user;
  }

  const newUser = {
    ...user,
    ...userUpdates,
  };

  users.set(id, newUser);

  return newUser;
}

export const setUserHasDrawn = (id: UserWithSocketId['socketId'], hasDrawn: boolean) => {
  const user = getUser(id);
  if (!user) {
    return;
  }
  users.set(id, {
    ...user,
    hasDrawn
  });
}