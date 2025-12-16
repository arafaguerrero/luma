import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import GenerateFromImage from "@/react-app/pages/GenerateFromImage";
import ChooseBaseColorMethod from "@/react-app/pages/ChooseBaseColorMethod";
import ChooseByCode from "@/react-app/pages/ChooseByCode";
import ChooseByWheel from "@/react-app/pages/ChooseByWheel";
import AuthCallback from "@/react-app/pages/AuthCallback";
import Login from "@/react-app/pages/Login";
import Subscription from "@/react-app/pages/Subscription";
import PaletteView from "@/react-app/pages/PaletteView";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generate-from-image" element={<GenerateFromImage />} />
          <Route path="/choose-base-color" element={<ChooseBaseColorMethod />} />
          <Route path="/choose-base-color/by-code" element={<ChooseByCode />} />
          <Route path="/choose-base-color/by-wheel" element={<ChooseByWheel />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/palette" element={<PaletteView />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
