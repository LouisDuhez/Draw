export const ENDPOINTS = {
  DEFAULT: '/',
  API: '/api',
  GET_USERS: '/api/users/get',
  GET_STROKES: '/api/strokes/get',
}

export const CLIENT_TO_SERVER_EVENTS_NAMES = {
  DISCONNECT: 'disconnect',
  CONNECTION: 'connection',
  MYUSER_JOIN: 'myUser:join',
  MYUSER_LEAVE: 'myUser:leave',
  MYUSER_EDIT: 'myUser:edit',
  DRAW_START: 'draw:start',
  DRAW_MOVE: 'draw:move',
  DRAW_END: 'draw:end',
}

export const SERVER_TO_CLIENT_EVENTS_NAMES = {
  MYUSER_JOINED: 'myUser:joined',
  USER_LEFT: 'user:left',
  USER_JOINED: 'user:joined',
  MYUSER_EDITED: 'myUser:edited',
  USERS_UPDATED: 'users:updated',
  DRAW_START: 'draw:start',
  DRAW_MOVE: 'draw:move',
  DRAW_END: 'draw:end',
}