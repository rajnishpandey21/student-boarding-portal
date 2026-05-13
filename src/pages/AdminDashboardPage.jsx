import React, { useEffect, useState } from 'react';
import { LoadingPanel } from '../components/Spinner';
import { api } from '../services/api';
import { useSession } from '../context/SessionContext';

export default function AdminDashboardPage() {
  const { sessionToken, admin } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await api.getPanIndiaDashboard(sessionToken);
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

  return (
    <div className="stack">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Pan India Admin Dashboard</h2>
            <p>National KPI view across all centers, associates, backlog, and completion progress.</p>
          </div>
          <div className="timer-badge">{admin?.adminName || 'Admin'}</div>
        </div>

        {loading ? <LoadingPanel label="Loading Pan India dashboard..." /> : null}
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
        <article className="metric-card">
          <span>OTP Sent</span>
          <strong>{data?.metrics?.otpSent || 0}</strong>
        </article>
        <article className="metric-card">
          <span>Completed</span>
          <strong>{data?.metrics?.completed || 0}</strong>
        </article>
        <article className="metric-card danger">
          <span>Overdue</span>
          <strong>{data?.metrics?.overdue || 0}</strong>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Center Summary</h2>
            <p>One row per branch with admissions, pendency, completions, and overdue load.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Center</th>
                <th>Total</th>
                <th>Pending</th>
                <th>In Progress</th>
                <th>OTP Sent</th>
                <th>Completed</th>
                <th>Overdue</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {(data?.branchSummary || []).map((item) => (
                <tr key={item.branchCode}>
                  <td>{item.branchCode}</td>
                  <td>{item.centerName}</td>
                  <td>{item.totalAdmissions}</td>
                  <td>{item.pending}</td>
                  <td>{item.inProgress}</td>
                  <td>{item.otpSent}</td>
                  <td>{item.completed}</td>
                  <td>{item.overdue}</td>
                  <td>{item.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Associate Productivity</h2>
            <p>Top-performing associates across all branches with completion volume and average duration.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Associate</th>
                <th>Branch</th>
                <th>Center</th>
                <th>Completed</th>
                <th>Average Duration</th>
              </tr>
            </thead>
            <tbody>
              {(data?.associateProductivity || []).map((item) => (
                <tr key={`${item.branchCode}-${item.associateName}`}>
                  <td>{item.associateName}</td>
                  <td>{item.branchCode}</td>
                  <td>{item.centerName}</td>
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
            <h2>Overdue Students</h2>
            <p>Most delayed onboarding cases across India, limited to the highest-aging records first.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Student</th>
                <th>Center</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Aging</th>
                <th>Associate</th>
              </tr>
            </thead>
            <tbody>
              {(data?.overdueStudents || []).map((item) => (
                <tr key={item.regno}>
                  <td>{item.regno}</td>
                  <td>{item.studentName}</td>
                  <td>{item.center}</td>
                  <td>{item.branchCode}</td>
                  <td>{item.status}</td>
                  <td>{item.agingDays} days</td>
                  <td>{item.associateName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
