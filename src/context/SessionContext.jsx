import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'student-boarding-session';
const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [state, setState] = useState(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { sessionToken: '', branch: null, associate: null, role: '', admin: null };
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = {
    sessionToken: state.sessionToken,
    branch: state.branch,
    associate: state.associate,
    role: state.role,
    admin: state.admin,
    setSession(sessionToken, branch, role = 'BRANCH', admin = null) {
      setState({ sessionToken, branch, associate: null, role, admin });
    },
    setAssociate(associate) {
      setState((current) => ({ ...current, associate }));
    },
    logout() {
      setState({ sessionToken: '', branch: null, associate: null, role: '', admin: null });
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return context;
}
