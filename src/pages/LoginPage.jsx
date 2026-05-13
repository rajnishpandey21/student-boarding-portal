import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ButtonSpinnerLabel, LoadingPanel } from '../components/Spinner';
import { api } from '../services/api';
import { useSession } from '../context/SessionContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useSession();
  const [loginMode, setLoginMode] = useState('BRANCH');
  const [branchCode, setBranchCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [centersLoading, setCentersLoading] = useState(true);
  const [centers, setCenters] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCenters() {
      try {
        const data = await api.getCenters();
        if (!active) {
          return;
        }

        setCenters(data.centers || []);
        if (data.centers?.length) {
          setBranchCode(data.centers[0].branchCode);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setCentersLoading(false);
        }
      }
    }

    loadCenters();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginMode === 'ADMIN') {
        const response = await api.loginAdmin({ adminEmail, password });
        setSession(response.sessionToken, response.branch, response.role, response.admin);
        navigate('/admin');
      } else {
        const response = await api.loginBranch({ branchCode, password });
        setSession(response.sessionToken, response.branch, response.role || 'BRANCH');
        navigate('/associate');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-layout">
      <section className="hero-panel">
        <p className="eyebrow">Pan India Onboarding Portal</p>
        <h2>Har Bachha Important hai!.</h2>
        <div className="hero-points">
          <span>21-point verified checklist</span>
          <span>Individual OTP confirmation</span>
          <span>7-day SLA command view</span>
        </div>
      </section>

      <section className="card auth-card">
        <div className="section-heading">
          <div>
            <h2>{loginMode === 'ADMIN' ? 'Admin Login' : 'Branch Login'}</h2>
            <p>
              {loginMode === 'ADMIN'
                ? 'Secure access to the Pan India command dashboard.'
                : 'Secure access to your center queue.'}
            </p>
          </div>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <div className="mode-switch">
            <button
              type="button"
              className={loginMode === 'BRANCH' ? 'mode-button active' : 'mode-button'}
              onClick={() => setLoginMode('BRANCH')}
            >
              Branch Access
            </button>
            <button
              type="button"
              className={loginMode === 'ADMIN' ? 'mode-button active' : 'mode-button'}
              onClick={() => setLoginMode('ADMIN')}
            >
              Admin Access
            </button>
          </div>

          {loginMode === 'ADMIN' ? (
            <label className="field">
              <span>Admin email</span>
              <input
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
              />
            </label>
          ) : (
            <label className="field">
              <span>Center</span>
              <select
                value={branchCode}
                onChange={(event) => setBranchCode(event.target.value)}
                disabled={centersLoading || loading}
              >
                {centers.map((center) => (
                  <option key={center.branchCode} value={center.branchCode}>
                    {center.centerName} ({center.branchCode})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
          </label>

          {loginMode === 'BRANCH' && centersLoading ? <LoadingPanel label="Loading centers..." /> : null}
          {error ? <p className="error-banner">{error}</p> : null}

          <button
            className="primary-button"
            disabled={loading || (loginMode === 'BRANCH' && (centersLoading || !branchCode)) || (loginMode === 'ADMIN' && !adminEmail)}
            type="submit"
          >
            <ButtonSpinnerLabel loading={loading} loadingLabel="Checking access...">
              {loginMode === 'ADMIN' ? 'Open Pan India Dashboard' : 'Continue to associate selection'}
            </ButtonSpinnerLabel>
          </button>
        </form>
      </section>
    </div>
  );
}
