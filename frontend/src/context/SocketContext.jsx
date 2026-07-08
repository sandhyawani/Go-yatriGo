import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./authContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";

export const SocketContext = createContext(null);

const isProduction = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
const SOCKET_URL = isProduction ? 'https://go-yatrigo.onrender.com' : (process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      // Connect only if we have a logged in user
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        query: { userId: userId }
      });

      const onConnect = () => {
                        newSocket.emit(SOCKET_EVENTS.EMIT_GO_ONLINE, userId);
      };

      // Register exactly ONE connect handler here — all other files must NOT emit go_online
            newSocket.on(SOCKET_EVENTS.CONNECT, onConnect);

      setSocket(newSocket);

      return () => {
                newSocket.off(SOCKET_EVENTS.CONNECT, onConnect);
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user?._id, user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
