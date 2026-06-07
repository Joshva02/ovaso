import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Home } from "@/pages/Home";
import { Docs } from "@/pages/Docs";
import { Changelog } from "@/pages/Changelog";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AnnouncementBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/changelog" element={<Changelog />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
