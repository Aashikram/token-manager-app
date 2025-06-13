import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { FaTrophy, FaSignOutAlt } from "react-icons/fa";
import "./DashboardLayout.css";

const DashboardLayout = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("role");

  const handleLogout = () => {
    try {
      // Clear all session data
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("emp_code");
      localStorage.removeItem("name");
      localStorage.removeItem("team");
      localStorage.removeItem("role");
      
      // Clear any other app state
      sessionStorage.clear();
      
      // Clear any pending timeouts/intervals
      if (window.sessionCheckInterval) {
        clearInterval(window.sessionCheckInterval);
      }
      
      // Call the parent's onLogout if provided
      if (onLogout) {
        onLogout();
      }
      
      // Navigate to login page
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to navigate to login
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <nav className="navbar">
        <div className="brand">
          <FaTrophy className="trophy-icon" />
          <span className="brand-text">Aarohan</span>
        </div>
        <div className="nav-center">
          <div className="nav-links">
            <Link
              to="/dashboard"
              className={`nav-link${location.pathname === "/dashboard" ? " active" : ""}`}
            >
              Dashboard
            </Link>
            <Link
              to="/dashboard/profile"
              className={`nav-link${location.pathname === "/dashboard/profile" ? " active" : ""}`}
            >
              Profile
            </Link>
            {userRole === "captain" && (
              <Link
                to="/dashboard/attendance"
                className={`nav-link${location.pathname === "/dashboard/attendance" ? " active" : ""}`}
              >
                Attendance
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="logout-button"
          type="button"
        >
          <FaSignOutAlt style={{ marginRight: "0.5rem" }} />
          Logout
        </button>
      </nav>
      {/* Main content */}
      <main className="main-content">
        <div className="background-element background-element-1"></div>
        <div className="background-element background-element-2"></div>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;