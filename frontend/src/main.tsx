import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { useAuthStore } from "./store/useAuthStore";

const queryClient = new QueryClient();

const isMockPreview = import.meta.env.DEV && new URLSearchParams(location.search).has("mock");

if (import.meta.env.DEV) {
  // Удобно для ручной проверки вне Telegram (в т.ч. макета "Номерок-стиль" по ?mock=1):
  // window.__authStore.getState().setSession(token, user) в консоли.
  (window as unknown as { __authStore: typeof useAuthStore }).__authStore = useAuthStore;
}

async function render() {
  if (isMockPreview) {
    const { MockPreviewApp } = await import("./mockups/nomerok/MockPreviewApp");
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <MockPreviewApp />
        </QueryClientProvider>
      </StrictMode>,
    );
    return;
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
}

render();
