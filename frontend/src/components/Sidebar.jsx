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
          width: 280px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 28px 20px 24px;
          background: #ffffff;
          border-right: 1px solid #EDF2F7;
          box-shadow: none !important;
          box-sizing: border-box;
          font-family: "Outfit", sans-serif;
        }

        .tf-sidebar-logo {
          height: 48px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 45px;
          text-decoration: none;
          padding: 0 4px;
        }

        .tf-sidebar-logo-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tf-sidebar-logo span {
          color: #111111;
          font-size: 28px;
          font-weight: 700;
          line-height: 32px;
          letter-spacing: -0.02em;
        }

        .tf-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tf-sidebar-link,
        .tf-sidebar-logout {
          height: 54px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 18px;
          border-radius: 12px;
          color: #333333;
          font-family: "Outfit", sans-serif;
          font-size: 17px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease;
          border: none;
          box-sizing: border-box;
        }

        .tf-sidebar-link:hover,
        .tf-sidebar-logout:hover {
          background: #f5f5f5;
          color: #111111;
        }

        .tf-sidebar-link svg,
        .tf-sidebar-logout svg {
          width: 23px;
          height: 23px;
          stroke-width: 2;
          flex-shrink: 0;
        }

        .tf-sidebar-link.active {
          background: #0a0a0a;
          color: #ffffff;
          font-weight: 600;
        }

        .tf-sidebar-link.active svg {
          color: #ffffff;
          stroke: #ffffff;
        }

        .tf-sidebar-logout {
          width: 100%;
          background: transparent;
          cursor: pointer;
          text-align: left;
          height: 50px;
        }
      `}</style>

      <div>
        <Link className="tf-sidebar-logo" to="/dashboard" aria-label="TutorFlow home">
          <div className="tf-sidebar-logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7.5C3 6.11929 4.11929 5 5.5 5H12C13.1046 5 14 5.89543 14 7V22C14 21.1716 13.3284 20.5 12.5 20.5H5.5C4.11929 20.5 3 21.6193 3 23V7.5Z" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
              <path d="M25 7.5C25 6.11929 23.8807 5 22.5 5H16C14.8954 5 14 5.89543 14 7V22C14 21.1716 14.6716 20.5 15.5 20.5H22.5C23.8807 20.5 25 21.6193 25 23V7.5Z" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
              <path d="M8.5 9.5L9 8L10.5 7.5L9 7L8.5 5.5L8 7L6.5 7.5L8 8L8.5 9.5Z" fill="#111111" />
              <circle cx="10" cy="11.5" r="0.8" fill="#111111" />
            </svg>
          </div>
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
