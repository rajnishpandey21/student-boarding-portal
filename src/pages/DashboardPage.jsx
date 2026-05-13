import React, { useEffect, useState } from 'react';
import { ButtonSpinnerLabel, LoadingPanel } from '../components/Spinner';
import { api } from '../services/api';
import { useSession } from '../context/SessionContext';

export default function DashboardPage() {
  const { sessionToken } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testStudentName, setTestStudentName] = useState('Test Student');
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await api.getDashboard(sessionToken);
        if (active) {
          setData(response);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [sessionToken]);

  async function sendTestEmail() {
    setEmailSending(true);
    setEmailMessage('');
    setError('');

    try {
      const response = await api.sendTestConfirmationEmail({
        sessionToken,
        email: testEmail,
        studentName: testStudentName
      });
      setEmailMessage(response.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Branch Dashboard</h2>
            <p>Live branch-scoped completion, pendency, and associate productivity snapshot.</p>
          </div>
        </div>

        {loading ? <LoadingPanel label="Loading dashboard..." /> : null}
        {error ? <p className="error-banner">{error}</p> : null}
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <span>Total Admissions</span>
          <strong>{data?.metrics?.totalAdmissions || 0}</strong>
        </article>
        <article className="metric-card">
          <span>Pending</span>
          <strong>{data?.metrics?.pending || 0}</strong>
        </article>
        <article className="metric-card">
          <span>In Progress</span>
          <strong>{data?.metrics?.inProgress || 0}</strong>
        </article>
        <article className="metric-card danger">
          <span>Overdue</span>
          <strong>{data?.metrics?.overdue || 0}</strong>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Associate Productivity</h2>
            <p>Completed count and average duration per associate in the current branch.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Associate</th>
                <th>Completed</th>
                <th>Average Duration</th>
              </tr>
            </thead>
            <tbody>
              {(data?.productivity || []).map((item) => (
                <tr key={item.associateName}>
                  <td>{item.associateName}</td>
                  <td>{item.completed}</td>
                  <td>{item.averageDuration} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Confirmation Email Test</h2>
            <p>Send a test welcome/confirmation email to verify the email pipeline is working.</p>
          </div>
        </div>

        <div className="stack">
          <label className="field">
            <span>Test email address</span>
            <input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="Enter your email" />
          </label>
          <label className="field">
            <span>Student name for test email</span>
            <input value={testStudentName} onChange={(event) => setTestStudentName(event.target.value)} placeholder="Test Student" />
          </label>
          {emailMessage ? <p className="info-banner">{emailMessage}</p> : null}
          <button className="primary-button" type="button" disabled={!testEmail || emailSending} onClick={sendTestEmail}>
            <ButtonSpinnerLabel loading={emailSending} loadingLabel="Sending test email...">
              Send test confirmation email
            </ButtonSpinnerLabel>
          </button>
        </div>
      </section>
    </div>
  );
}
