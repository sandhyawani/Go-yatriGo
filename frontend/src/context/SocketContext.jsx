import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./authContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";

export const SocketContext = createContext(null);

const isProduction = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
let SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (isProduction ? 'https://go-yatrigo.onrender.com' : 'http://localhost:5000');


if (SOCKET_URL) {

  SOCKET_URL = SOCKET_URL.replace('go-yatri-go.onrender.com', 'go-yatrigo.onrender.com');


  if (isProduction && SOCKET_URL.includes('localhost')) {
    SOCKET_URL = 'https://go-yatrigo.onrender.com';
  }


  SOCKET_URL = SOCKET_URL.replace(/\/+$/, '').replace(/\/api$/, '');
}

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {

      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        auth: {
          token: user.token
        }
      });

      const onConnect = () => {
        newSocket.emit(SOCKET_EVENTS.EMIT_GO_ONLINE, userId);
      };


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
    </SocketContext.Provider>);

};