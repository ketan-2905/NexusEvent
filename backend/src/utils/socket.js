// Socket.IO utility functions for emitting events

let ioInstance = null;

export const setSocketIO = (io) => {
  ioInstance = io;
};

export const getSocketIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO instance not initialized. Call setSocketIO() first.");
  }
  return ioInstance;
};

