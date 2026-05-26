import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { Home } from "@/pages/Home";
import { Docs } from "@/pages/Docs";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
