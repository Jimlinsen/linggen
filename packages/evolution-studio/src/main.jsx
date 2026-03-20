import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EvolutionApp from "./EvolutionApp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EvolutionApp />
  </StrictMode>
);
