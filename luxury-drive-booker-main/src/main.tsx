import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { API_URL } from "./admin/api";

(async () => {
  try {
    const resp = await fetch(`${API_URL}/config/admin/version`, { cache: 'no-store' });
    if (resp.ok) {
      const { cache_version } = await resp.json();
      const localV = localStorage.getItem('lux-cache-version');
      if (String(localV) !== String(cache_version)) {
        localStorage.setItem('lux-cache-version', String(cache_version));
        if (!sessionStorage.getItem('cache-version-reload')) {
          sessionStorage.setItem('cache-version-reload', '1');
          location.reload();
        }
      } else {
        sessionStorage.removeItem('cache-version-reload');
      }
    }
  } catch (e) {
    // silencia erro de versão
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
