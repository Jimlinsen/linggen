import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import NutshellUniverse from "./NutshellUniverse.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <NutshellUniverse />
  </StrictMode>
);
