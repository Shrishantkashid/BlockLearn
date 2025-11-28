import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from "./providers/ThemeProvider";
import App from "./App.jsx";
import "./index.css";

// Removed incorrect SocketProvider import that was causing connection to port 8002
// import { SocketProvider } from '../../React-webRTC/client/src/context/SocketProvider';

const GOOGLE_CLIENT_ID = '600190604921-1ecm9djtasjj0fvagqen4j7s4jai24a7.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          {/* Removed SocketProvider wrapper that was causing connection errors to port 8002 */}
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);