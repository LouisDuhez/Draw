import { Server, Socket } from 'socket.io';
import { addUser, editUser, getUsers, User, UserWithSocketId, removeUser } from './user';
import { addDrawStroke, updateDrawStroke, completeDrawStroke,  getAllStrokes, clearAllStrokes, startAutomaticCleanup } from './draw';
import { ENDPOINTS, CLIENT_TO_SERVER_EVENTS_NAMES, SERVER_TO_CLIENT_EVENTS_NAMES } from './config';
import express from 'express';

export * from './user';

export const handleAppForClient = (app: ReturnType<typeof express>, io: Server, socket: Socket) => {
  console.log('Server: Handle Draw App for client ', {socketId: socket.id});

  const logListen = (eventName: string, payload: unknown) => {
    console.log('🎧 On event', { eventName, payload });
  }

  const emitToSender = (eventName: string, payload: any) => {
    try {
      io.to(socket.id).emit(eventName, payload);
      console.log('✅ Event emitted to sender', { eventName, payload });
    } catch (error) {
      console.error('❌ Error emitting event to sender:', error, {eventName, payload});
    }
  }

  const emitToAll = (eventName: string, payload: any) => {
    try {
      io.emit(eventName, payload);
      console.log('✅ Event emitted to all clients', {eventName, payload});
    } catch (error) {
      console.error('❌ Error emitting event to all clients:', error, {eventName, payload});
    }
  }

  const emitToAllButSender = (eventName: string, payload: any) => {
    try {
      socket.broadcast.emit(eventName, payload);
      console.log('✅ Event emitted successfully to all clients except sender', {eventName, payload});
    } catch (error) {
      console.error('❌ Error emitting event to all clients except sender:', error, {eventName, payload});
    }
  }

  /* === ÉVÉNEMENTS DE GESTION / CONNEXION / DECONNECTION DES UTILISATEURS === */

  socket.on(CLIENT_TO_SERVER_EVENTS_NAMES.MYUSER_JOIN, (user: Partial<User>) => {
    logListen(CLIENT_TO_SERVER_EVENTS_NAMES.MYUSER_JOIN, { user });

    const addedUser = addUser(socket.id, user);

    emitToSender(SERVER_TO_CLIENT_EVENTS_NAMES.MYUSER_JOINED, { user: addedUser });

    emitToAll(SERVER_TO_CLIENT_EVENTS_NAMES.USER_JOINED, { user: addedUser });
    emitToAll(SERVER_TO_CLIENT_EVENTS_NAMES.USERS_UPDATED, { users: getUsers() });
  });

  socket.on(CLIENT_TO_SERVER_EVENTS_NAMES.MYUSER_EDIT, (userId: UserWithSocketId['socketId'], userUpdates: Partial<User>) => {
    logListen(CLIENT_TO_SERVER_EVENTS_NAMES.MYUSER_EDIT, { userId, userUpdates });

    const editedUser = editUser(userId, userUpdates);

    emitToSender(SERVER_TO_CLIENT_EVENTS_NAMES.MYUSER_EDITED, { user: editedUser });
    emitToAll(SERVER_TO_CLIENT_EVENTS_NAMES.USERS_UPDATED, { users: getUsers() });
  });

  socket.on(CLIENT_TO_SERVER_EVENTS_NAMES.MYUSER_LEAVE, (userId: UserWithSocketId['socketId']) => {
    logListen(CLIENT_TO_SERVER_EVENTS_NAMES.MYUSER_LEAVE, { userId });

    const deletedUser = removeUser(userId);

    emitToAll(SERVER_TO_CLIENT_EVENTS_NAMES.USER_LEFT, { user: deletedUser });
    emitToAll(SERVER_TO_CLIENT_EVENTS_NAMES.USERS_UPDATED, { users: getUsers() });
  });

  socket.on(CLIENT_TO_SERVER_EVENTS_NAMES.DISCONNECT, () => {
    const deletedUser = removeUser(socket.id);
    console.log('Server: A client was disconnected', { socketId: socket.id, deletedUser });

    emitToAll(SERVER_TO_CLIENT_EVENTS_NAMES.USER_LEFT, { user: deletedUser });
    emitToAll(SERVER_TO_CLIENT_EVENTS_NAMES.USERS_UPDATED, { users: getUsers() });
  });

    /* === ÉVÉNEMENTS DE GESTION DES DESSINS === */
  
  socket.on(CLIENT_TO_SERVER_EVENTS_NAMES.DRAW_START, (data: { x: number; y: number; color: string; strokeWidth: number }) => {
    logListen(CLIENT_TO_SERVER_EVENTS_NAMES.DRAW_START, data);
    
    const { x, y, color, strokeWidth } = data;
    const userId = socket.id;
    
    const stroke = addDrawStroke(userId, { x, y }, color, strokeWidth);
    editUser(userId, { hasDrawn: true });
    
    emitToAll(SERVER_TO_CLIENT_EVENTS_NAMES.USERS_UPDATED, { users: getUsers() });

    
    emitToAllButSender(SERVER_TO_CLIENT_EVENTS_NAMES.DRAW_START, stroke);
  });

  socket.on(CLIENT_TO_SERVER_EVENTS_NAMES.DRAW_MOVE, (data: { x: number; y: number }) => {
    logListen(CLIENT_TO_SERVER_EVENTS_NAMES.DRAW_MOVE, data);

    const { x, y } = data;
    const userId = socket.id;
    
    const stroke = updateDrawStroke(userId, { x, y });
    
    if (stroke) {
      emitToAllButSender(CLIENT_TO_SERVER_EVENTS_NAMES.DRAW_MOVE, stroke);
    }
  });

  socket.on(CLIENT_TO_SERVER_EVENTS_NAMES.DRAW_END, () => {
    logListen(CLIENT_TO_SERVER_EVENTS_NAMES.DRAW_END, {});

    const userId = socket.id;
    
    const stroke = completeDrawStroke(userId);
    
    if (stroke) {
      emitToAllButSender(CLIENT_TO_SERVER_EVENTS_NAMES.DRAW_END, stroke);
    }
  });

  socket.on('canvas:reset', () => {
    logListen('canvas:reset', {});
    
    // Effacer tous les traits du serveur
    clearAllStrokes();
    
    // Notifier tous les clients (y compris l'émetteur)
    emitToAll('canvas:reset', {});
    console.log('🗑️ Canvas reset - all strokes cleared');
  });

  app.get(ENDPOINTS.GET_USERS, (req, res) => {
    try {
      console.log('ENDPOINTS.GET_USERS', ENDPOINTS.GET_USERS)
      res.status(200).json({
        users: getUsers()
      })
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  /* Endpoint pour récupérer tous les dessins existants */
  app.get(ENDPOINTS.GET_STROKES, (req, res) => {
    try {
      const allStrokes = getAllStrokes();
      res.status(200).json({ strokes: allStrokes });
      console.log('📡 All strokes fetched:', { count: allStrokes.length });
    } catch (error) {
      console.error('❌ Error fetching strokes:', error);
      res.status(500).json({ error: 'Failed to fetch strokes' });
    }
  });
}

export const handleAppCleanup = () => {
  console.log('Server: Cleaning up Draw App resources if needed');

  // Suppression des tracés de dessins de plus de 2h (lancé toutes les 60 minutes)
  startAutomaticCleanup(60, 2);
}