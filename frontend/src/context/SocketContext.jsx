// import React, { createContext, useContext, useEffect, useState } from "react";
// import { io } from "socket.io-client";
// import { AuthContext } from "./authContext";

// export const SocketContext = createContext(null);

// const isProduction = window.location.hostname.includes('vercel.app') || process.env.NODE_ENV === 'production';
// const SOCKET_URL = isProduction ? 'https://go-yatrigo.onrender.com' : (process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

// export const SocketProvider = ({ children }) => {
//   const { user } = useContext(AuthContext);
//   const [socket, setSocket] = useState(null);

//   useEffect(() => {
//     const userId = user?._id || user?.id;
//     if (userId) {
//       // Connect only if we have a logged in user
//       const newSocket = io(SOCKET_URL, {
//         withCredentials: true,
//         transports: ["websocket", "polling"],
//         query: { userId: userId }
//       });
      
//       newSocket.on("connect", () => {
//         console.log("Socket connected:", newSocket.id);
//         newSocket.emit("go_online", userId);
//       });
      
//       setSocket(newSocket);

//       return () => {
//         newSocket.disconnect();
//         setSocket(null);
//       };
//     }
//   }, [user?._id, user?.id]);

//   return (
//     <SocketContext.Provider value={socket}>
//       {children}
//     </SocketContext.Provider>
//   );
// };


import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./authContext";

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
        // Start on polling (always works) and let engine.io upgrade to
        // websocket in the background if the network allows it. Forcing
        // "websocket" first causes a loud, repeated console error and a
        // fallback delay on networks/AV software that block raw ws
        // upgrades but allow plain HTTP long-polling.
        transports: ["polling", "websocket"],
        query: { userId: userId }
      });
      
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        newSocket.emit("go_online", userId);
      });
      
      setSocket(newSocket);

      return () => {
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