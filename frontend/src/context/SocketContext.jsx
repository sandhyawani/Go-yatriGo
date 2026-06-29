import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./authContext";

export const SocketContext = createContext(null);

const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app');
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (isProduction ? "https://go-yatrigo.onrender.com" : "http://localhost:5000");

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user?._id) {
      // Connect only if we have a logged in user
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        query: { userId: user._id }
      });
      
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user?._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
