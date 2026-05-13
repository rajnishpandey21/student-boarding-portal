import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ButtonSpinnerLabel, LoadingPanel } from '../components/Spinner';
import { api } from '../services/api';
import { useSession } from '../context/SessionContext';

export default function QueuePage() {
  const navigate = useNavigate();
  const { sessionToken } = useSession();
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [savingEmailRegno, setSavingEmailRegno] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [queue, setQueue] = useState({ items: [], stats: {} });
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [emailDrafts, setEmailDrafts] = useState({});

  function normalizeEmailValue(value) {
    return String(value || '').trim().toLowerCase();
  }

  async function loadQueue() {
    setLoading(true);
    setError('');
    setInfo('');

    try {
      const data = await api.getQueue({ sessionToken, search, status });
      setQueue(data);
      setEmailDrafts(
        Object.fromEntries((data.items || []).map((student) => [student.regno, student.studentEmail || '']))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  function toggleStudent(regno) {
    setSelected((current) =>
      current.includes(regno) ? current.filter((value) => value !== regno) : [...current, regno]
    );
  }

  function selectAllVisible() {
    const visible = (queue.items || [])
      .filter((student) => student.status !== 'COMPLETED')
      .map((student) => student.regno);
    setSelected(visible);
  }

  function clearAllVisible() {
    setSelected([]);
  }

  function updateEmailDraft(regno, value) {
    setEmailDrafts((current) => ({
      ...current,
      [regno]: value
    }));
  }

  async function handleSaveEmail(student) {
    const studentEmail = emailDrafts[student.regno] || '';
    setSavingEmailRegno(student.regno);
    setError('');
    setInfo('');

    try {
      const data = await api.updateStudentEmail({ sessionToken, regno: student.regno, studentEmail });
      setQueue((current) => ({
        ...current,
        items: (current.items || []).map((item) => (
          item.regno === student.regno ? { ...item, studentEmail: data.student.studentEmail } : item
        ))
      }));
      setEmailDrafts((current) => ({
        ...current,
        [student.regno]: data.student.studentEmail
      }));
      setInfo(`Email updated for ${student.studentName}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEmailRegno('');
    }
  }

  async function handleBulkStart() {
    if (!selected.length) {
      return;
    }

    setBulkLoading(true);
    setError('');
    setInfo('');
    try {
      const batch = await api.startBulkBatch({ sessionToken, regnos: selected });
      navigate('/bulk', { state: batch });
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="metric-grid">
        <article className="metric-card">
          <span>Pending</span>
          <strong>{queue.stats.pending || 0}</strong>
        </article>
        <article className="metric-card">
          <span>In Progress</span>
          <strong>{queue.stats.inProgress || 0}</strong>
        </article>
        <article className="metric-card">
          <span>Completed</span>
          <strong>{queue.stats.completed || 0}</strong>
        </article>
        <article className="metric-card danger">
          <span>Overdue</span>
          <strong>{queue.stats.overdue || 0}</strong>
        </article>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Branch Queue</h2>
            <p>Filter by status, search by regno or name, and move into single or bulk boarding.</p>
          </div>
          <button className="primary-button" type="button" onClick={handleBulkStart} disabled={!selected.length || loading || bulkLoading}>
            <ButtonSpinnerLabel loading={bulkLoading} loadingLabel="Starting bulk session...">
              {`Start bulk session (${selected.length})`}
            </ButtonSpinnerLabel>
          </button>
        </div>

        <div className="toolbar">
          <label className="field compact">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Regno, name, course..." />
          </label>
          <label className="field compact">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DRAFT_SAVED">Draft Saved</option>
              <option value="OTP_SENT">OTP Sent</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>
          <button className="ghost-button" type="button" onClick={loadQueue} disabled={loading || bulkLoading}>
            <ButtonSpinnerLabel loading={loading} loadingLabel="Refreshing...">
              Refresh
            </ButtonSpinnerLabel>
          </button>
          <button className="ghost-button" type="button" onClick={selectAllVisible} disabled={loading || bulkLoading}>
            Select all
          </button>
          <button className="ghost-button" type="button" onClick={clearAllVisible} disabled={loading || bulkLoading || !selected.length}>
            Clear all
          </button>
        </div>

        {loading ? <LoadingPanel label="Loading queue..." /> : null}
        {error ? <p className="error-banner">{error}</p> : null}
        {info ? <p className="info-banner">{info}</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>Reg No</th>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Status</th>
                <th>Aging</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.items?.map((student) => (
                <tr key={student.regno}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(student.regno)}
                      disabled={student.status === 'COMPLETED'}
                      onChange={() => toggleStudent(student.regno)}
                    />
                  </td>
                  <td>{student.regno}</td>
                  <td>
                    <strong>{student.studentName}</strong>
                    <span className="table-subline">{student.center}</span>
                  </td>
                  <td>
                    <div className="table-email-editor">
                      <input
                        value={emailDrafts[student.regno] ?? student.studentEmail ?? ''}
                        onChange={(event) => updateEmailDraft(student.regno, event.target.value)}
                        placeholder="student@email.com"
                        disabled={loading || bulkLoading || savingEmailRegno === student.regno}
                      />
                      <button
                        className="ghost-button"
                        type="button"
                        disabled={
                          loading ||
                          bulkLoading ||
                          savingEmailRegno === student.regno ||
                          normalizeEmailValue(emailDrafts[student.regno]) === normalizeEmailValue(student.studentEmail)
                        }
                        onClick={() => handleSaveEmail(student)}
                      >
                        <ButtonSpinnerLabel loading={savingEmailRegno === student.regno} loadingLabel="Saving...">
                          Save
                        </ButtonSpinnerLabel>
                      </button>
                    </div>
                  </td>
                  <td>{student.course}</td>
                  <td>
                    <span className={student.overdue ? 'pill danger' : 'pill'}>{student.status}</span>
                  </td>
                  <td>{student.agingDays} days</td>
                  <td>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => navigate(`/student/${student.regno}`)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
