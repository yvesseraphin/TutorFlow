import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Home,
  LogOut,
  UserRound,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home, exact: true },
  { to: "/classroom", label: "My Lessons", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="tf-sidebar">
      <style>{`
        .tf-sidebar {
          width: 272px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 28px 14px 28px;
          background: #ffffff;
          border-right: 1px solid #dfe7f6;
          box-sizing: border-box;
          font-family: "Outfit", sans-serif;
        }

        .tf-sidebar-logo {
          height: 48px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 12px 64px;
          text-decoration: none;
        }

        .tf-sidebar-logo img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .tf-sidebar-logo span {
          color: #1D4ED8;
          font-size: 25px;
          font-weight: 700;
          line-height: 30px;
          letter-spacing: 0;
        }

        .tf-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .tf-sidebar-link,
        .tf-sidebar-logout {
          height: 48px;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 0 16px;
          border-radius: 8px;
          color: #1b2b6b;
          font-family: "Outfit", sans-serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 22px;
          text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
        }

        .tf-sidebar-link:hover,
        .tf-sidebar-logout:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .tf-sidebar-link svg,
        .tf-sidebar-logout svg {
          width: 24px;
          height: 24px;
          stroke-width: 2;
          flex: 0 0 auto;
        }

        .tf-sidebar-link.active {
          background: #0054ff;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 12px 24px rgba(0, 84, 255, 0.18);
        }

        .tf-sidebar-logout {
          width: 100%;
          border: 0;
          background: transparent;
          cursor: pointer;
          text-align: left;
        }
      `}</style>

      <div>
        <Link className="tf-sidebar-logo" to="/dashboard" aria-label="TutorFlow home">
          <img src="/Logo_icon.png" alt="" />
          <span>TutorFlow</span>
        </Link>

        <nav className="tf-sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              !item.inactiveOnly &&
              (item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                className={`tf-sidebar-link${isCurrent ? " active" : ""}`}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <button type="button" className="tf-sidebar-logout" onClick={handleLogout}>
        <LogOut aria-hidden="true" />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
