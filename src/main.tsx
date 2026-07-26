import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./app/error-boundary";
import { ThemeProvider } from "./app/theme-provider";
import { registerBuiltinWidgets } from "./features/widgets";
import "./styles/index.css";

registerBuiltinWidgets();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
