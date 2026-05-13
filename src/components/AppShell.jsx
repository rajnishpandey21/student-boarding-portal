import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

const branchNavItems = [
  { path: '/queue', label: 'Queue' },
  { path: '/bulk', label: 'Bulk' },
  { path: '/dashboard', label: 'Dashboard' }
];

const adminNavItems = [
  { path: '/admin', label: 'Pan India Dashboard' }
];

export default function AppShell({ children }) {
  const { branch, associate, sessionToken, role, admin, logout } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = role === 'ADMIN' ? adminNavItems : branchNavItems;

  return (
    <div className="app-frame">
      <header className="topbar">
        <div>
          <p className="eyebrow">Welcome</p>
          <h1>Govt Exams Wallah</h1>
        </div>

        {sessionToken ? (
          <div className="topbar-meta">
            <div>
              <strong>{role === 'ADMIN' ? 'Pan India Admin' : (branch?.centerName || 'Branch')}</strong>
              <span>{role === 'ADMIN' ? (admin?.adminName || 'Admin') : (associate?.associateName || 'Associate not selected')}</span>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Logout
            </button>
          </div>
        ) : null}
      </header>

      {sessionToken ? (
        <nav className="main-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'nav-link active' : 'nav-link'}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <main className="page-shell">{children}</main>
    </div>
  );
}
