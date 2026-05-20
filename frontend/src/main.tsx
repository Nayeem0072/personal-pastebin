import React from "react";
import ReactDOM from "react-dom/client";

// Apply saved theme before first render to prevent flash
(function () {
  try {
    if (localStorage.getItem("clippr-theme") === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch {
    // ignore
  }
})();
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
