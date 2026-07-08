import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { AuthContextProvider } from "./context/authContext";
import { SocketProvider } from "./context/SocketContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <>
    <AuthContextProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthContextProvider>
  </>
);

