export const environment = {
  production: true,
  apiUrl: 'https://backendcommercial.onrender.com/api',
  wsUrl: 'https://backendcommercial.onrender.com',
  frontendUrl: 'https://www.smarket.qzz.io',
  socket: {
    transports: ['websocket', 'polling'] as string[],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
    timeout: 30000
  }
};
