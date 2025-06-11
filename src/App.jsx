import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ScanNow from "./pages/scan-now";
import Profile from "./pages/profile";
import Game from "./pages/game"; // ✅ Import Game page
import SignUp from "./pages/SignUp";
import Attendance from "./pages/attendance";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // start as null

  useEffect(() => {
    const auth = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(auth);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  // While checking login status, show a loading spinner
  if (isLoggedIn === null) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        <Route
          path="/dashboard/*"
          element={
            isLoggedIn ? (
              <DashboardLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="scan-now" element={<ScanNow />} />
          <Route path="profile" element={<Profile />} />
          <Route path="attendance" element={<Attendance />} />
        </Route>

        {/* ✅ Game page route — protected, but NOT under dashboard layout */}
        <Route
          path="/game"
          element={
            isLoggedIn ? <Game /> : <Navigate to="/login" replace />
          }
        />

        <Route path="/signup" element={<SignUp />} />

        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
