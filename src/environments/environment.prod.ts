export const environment = {
  production: true,
  apiUrl: '/api',
  wsUrl: '',
  frontendUrl: '',
  socket: {
    transports: ['websocket', 'polling'] as string[],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
    timeout: 30000
  }
};
