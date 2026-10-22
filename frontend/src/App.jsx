import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DashboardPage from "./pages/DashboardPage";
import LearningPage from "./pages/LearningPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFoundPage from "./pages/NotFoundPage";

import { ThemeProvider } from "./components/ui/theme/ThemeContext";
import { MotionProvider } from "./components/ui/motion/MotionProvider";
import { SmoothScroll } from "./components/ui/motion/SmoothScroll";
import { PageTransition } from "./components/ui/motion/PageTransition";

function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <MotionProvider>
        <SmoothScroll>
          {/* Physical Frosted Glass Tactile Noise Overlay */}
          <div className="noise-overlay" aria-hidden="true" />
          
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
              <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
              <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
              <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
              <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
              <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />
              <Route path="/onboarding" element={<PageTransition><OnboardingPage /></PageTransition>} />
              <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
              <Route path="/learn/:stepId" element={<PageTransition><LearningPage /></PageTransition>} />
              <Route path="/learning/:stepId" element={<PageTransition><LearningPage /></PageTransition>} />

              {/* Handles unknown URLs */}
              <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </SmoothScroll>
      </MotionProvider>
    </ThemeProvider>
  );
}

export default App;