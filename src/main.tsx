import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error tracking for better debugging in production
if (import.meta.env.PROD) {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error("Global Error:", { message, source, lineno, colno, error });
    // If the error is persistent, we can show a minimal UI overlay
    const root = document.getElementById("root");
    if (root && root.innerHTML === "") {
      root.innerHTML = `<div style="padding: 20px; color: white; background: #880000; font-family: sans-serif;">
        <h2>Erro de Carregamento</h2>
        <p>${message}</p>
        <pre style="font-size: 12px;">${error?.stack || ''}</pre>
        <button onclick="location.reload()" style="padding: 8px 16px; background: white; color: black; border: none; border-radius: 4px; cursor: pointer;">Recarregar</button>
      </div>`;
    }
  };

  window.onunhandledrejection = (event) => {
    console.error("Unhandled Rejection:", event.reason);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
