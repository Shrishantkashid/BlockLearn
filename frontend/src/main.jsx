import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App.jsx";
import "./index.css";

const GOOGLE_CLIENT_ID = '600190604921-1ecm9djtasjj0fvagqen4j7s4jai24a7.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);