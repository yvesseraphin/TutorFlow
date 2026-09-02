import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Home,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home, exact: true },
  { to: "/classroom", label: "My Lessons", icon: BookOpen },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    setTimeout(() => {
      const heroEl = document.getElementById("hero");
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
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
          height: 54px;
          display: flex;
          align-items: center;
          margin-bottom: 36px;
          text-decoration: none;
          padding: 0 12px;
        }

        .tf-sidebar-logo img {
          height: 46px;
          max-width: 190px;
          object-fit: contain;
          object-position: left center;
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
        <Link className="tf-sidebar-logo" to="/" aria-label="TutorFlow home">
          <img
            src="/Logo_cropped.png"
            alt="TutorFlow"
          />
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
