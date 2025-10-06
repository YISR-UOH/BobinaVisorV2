import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App.jsx";
import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
  onRegisteredSW(_, registration) {
    registration?.update();
    if (registration) {
      setInterval(() => {
        registration.update().catch((error) => {
          console.error("Error actualizando el service worker", error);
        });
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error("Error registrando el service worker", error);
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
