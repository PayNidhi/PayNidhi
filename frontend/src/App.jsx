// src/App.jsx
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import SolutionsPage from "./pages/SolutionsPage";
import MarketplacePage from "./pages/MarketplacePage";
import TrustScorePage from "./pages/TrustScorePage";
import PublicLayout from "./layouts/PublicLayout";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import OtpVerifyCard from "./components/auth/OtpVerifyCard";




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
        <Route path="/otp-verify" element={<PublicLayout><OtpVerifyCard /></PublicLayout>} />

        {/* Auth pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
      </Routes>
    </>
  );
}

export default App;