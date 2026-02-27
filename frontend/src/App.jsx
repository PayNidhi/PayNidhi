// src/App.jsx
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import SolutionsPage from "./pages/SolutionsPage";
import MarketplacePage from "./pages/MarketplacePage";
import TrustScorePage from "./pages/TrustScorePage";
import PublicLayout from "./layouts/PublicLayout";



function App() {
  return (
    <>
      <Routes>
        {/* Public marketing pages */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/solutions" element={<PublicLayout><SolutionsPage /></PublicLayout>} />
        <Route path="/marketplace" element={<PublicLayout><MarketplacePage /></PublicLayout>} />
        <Route path="/trustscore" element={<PublicLayout><TrustScorePage /></PublicLayout>} />

      </Routes>
    </>
  );
}

export default App;