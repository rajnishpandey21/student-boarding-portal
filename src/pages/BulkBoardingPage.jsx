import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChecklistEditor from '../components/ChecklistEditor';
import { ButtonSpinnerLabel, LoadingPanel } from '../components/Spinner';
import { CHECKLIST_ITEMS } from '../config/checklist';
import { api } from '../services/api';
import { useSession } from '../context/SessionContext';

function buildEmptyChecklist() {
  return CHECKLIST_ITEMS.reduce((accumulator, item) => {
    accumulator[item.key] = '';
    return accumulator;
  }, {});
}

function buildAllYesChecklist() {
  return CHECKLIST_ITEMS.reduce((accumulator, item) => {
    accumulator[item.key] = 'YES';
    return accumulator;
  }, {});
}

export default function BulkBoardingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionToken } = useSession();
  const [batch, setBatch] = useState(location.state || null);
  const [students, setStudents] = useState(location.state?.students || []);
  const [checklist, setChecklist] = useState(buildEmptyChecklist);
  const [notes, setNotes] = useState('');
  const [otpInputs, setOtpInputs] = useState({});
  const [emailDrafts, setEmailDrafts] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingEmailRegno, setSavingEmailRegno] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    if (!batch?.batchId && !batch?.startedAt) {
      return undefined;
    }

    const startedAt = batch.startedAt || new Date().toISOString();
    const timer = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [batch]);

  useEffect(() => {
    if (!batch?.batchId) {
      return undefined;
    }

    let active = true;

    async function loadBatchStudents() {
      setLoadingStudents(true);
      try {
        const data = await api.getBulkStudents({ sessionToken, batchId: batch.batchId });
        if (!active) {
          return;
        }
        setBatch((current) => ({
          ...(current || {}),
          ...(data.batch || {})
        }));
        setStudents(data.students || []);
        setEmailDrafts(
          Object.fromEntries((data.students || []).map((student) => [student.regno, student.studentEmail || '']))
        );
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoadingStudents(false);
        }
      }
    }

    loadBatchStudents();
    return () => {
      active = false;
    };
  }, [batch?.batchId, sessionToken]);

  const checklistComplete = CHECKLIST_ITEMS.every((item) => checklist[item.key] === 'YES' || checklist[item.key] === 'NO');

  function normalizeEmailValue(value) {
    return String(value || '').trim().toLowerCase();
  }

  function updateChecklist(key, value) {
    setChecklist((current) => ({ ...current, [key]: value }));
  }

  function markAllYes() {
    setChecklist(buildAllYesChecklist());
  }

  function clearAllChecklist() {
    setChecklist(buildEmptyChecklist());
  }

  function updateOtp(regno, value) {
    setOtpInputs((current) => ({ ...current, [regno]: value }));
  }

  function updateEmailDraft(regno, value) {
    setEmailDrafts((current) => ({ ...current, [regno]: value }));
  }

  async function handleSaveEmail(student) {
    setSavingEmailRegno(student.regno);
    setError('');
    setInfo('');

    try {
      const data = await api.updateStudentEmail({
        sessionToken,
        regno: student.regno,
        studentEmail: emailDrafts[student.regno] || ''
      });
      setStudents((current) => current.map((item) => (
        item.regno === student.regno ? { ...item, studentEmail: data.student.studentEmail } : item
      )));
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

  async function runAction(fn, message) {
    setError('');
    setInfo('');
    try {
      const data = await fn();
      if (data.batch) {
        setBatch((current) => ({ ...current, ...data.batch }));
      }
      setInfo(data.message || message);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }

  if (!batch?.batchId) {
    return (
      <section className="card empty-state">
        <h2>No active bulk batch</h2>
        <p>Start a bulk session from the queue after selecting students from the same branch.</p>
        <button className="primary-button" type="button" onClick={() => navigate('/queue')}>
          Back to queue
        </button>
      </section>
    );
  }

  const elapsedMinutes = Math.floor(elapsed / 60);
  const elapsedSeconds = elapsed % 60;
  const hasUnsavedEmailChanges = students.some((student) => (
    normalizeEmailValue(emailDrafts[student.regno]) !== normalizeEmailValue(student.studentEmail)
  ));
  const hasMissingStudentEmails = students.some((student) => !normalizeEmailValue(emailDrafts[student.regno] ?? student.studentEmail));

  return (
    <div className="stack">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Bulk Boarding Session</h2>
            <p>One shared checklist session, but each student still receives and verifies an individual OTP email.</p>
          </div>
          <div className="timer-badge">
            {String(elapsedMinutes).padStart(2, '0')}:{String(elapsedSeconds).padStart(2, '0')}
          </div>
        </div>

        <div className="student-summary">
          <div><span>Batch ID</span><strong>{batch.batchId}</strong></div>
          <div><span>Student count</span><strong>{batch.studentCount || batch.regnos?.length || 0}</strong></div>
          <div><span>Status</span><strong>{batch.status || 'IN_PROGRESS'}</strong></div>
          <div><span>Branch</span><strong>{batch.branchCode || 'Current branch'}</strong></div>
        </div>

        <div className="selected-regnos">
          {(batch.regnos || []).map((regno) => (
            <span className="tag" key={regno}>{regno}</span>
          ))}
        </div>

        {loadingStudents ? <LoadingPanel label="Loading selected students..." /> : null}
        {error ? <p className="error-banner">{error}</p> : null}
        {info ? <p className="info-banner">{info}</p> : null}
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Student Email Verification</h2>
            <p>Correct missing or wrong email addresses here before sending individual OTP emails to the selected students.</p>
          </div>
        </div>

        <div className="otp-matrix student-email-grid">
          {students.map((student) => (
            <div className="inline-edit-card" key={student.regno}>
              <label className="field compact flex-grow">
                <span>{student.studentName} ({student.regno})</span>
                <input
                  value={emailDrafts[student.regno] ?? student.studentEmail ?? ''}
                  onChange={(event) => updateEmailDraft(student.regno, event.target.value)}
                  placeholder="student@email.com"
                  disabled={loadingStudents || Boolean(actionLoading) || savingEmailRegno === student.regno}
                />
              </label>
              <button
                className="ghost-button"
                type="button"
                disabled={
                  loadingStudents ||
                  Boolean(actionLoading) ||
                  savingEmailRegno === student.regno ||
                  normalizeEmailValue(emailDrafts[student.regno]) === normalizeEmailValue(student.studentEmail)
                }
                onClick={() => handleSaveEmail(student)}
              >
                <ButtonSpinnerLabel loading={savingEmailRegno === student.regno} loadingLabel="Saving email...">
                  Save email
                </ButtonSpinnerLabel>
              </button>
            </div>
          ))}
        </div>
      </section>

      <ChecklistEditor
        checklist={checklist}
        onChange={updateChecklist}
        onMarkAllYes={markAllYes}
        onClearAll={clearAllChecklist}
        title="Shared Bulk Checklist"
        subtitle="This checklist submission is applied to every student in the selected batch."
      />

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Draft, OTP, and Verification Matrix</h2>
            <p>Bulk mode still requires separate OTP entry for every student before the batch can close.</p>
          </div>
        </div>

        <label className="field">
          <span>Session notes</span>
          <textarea rows="5" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes for this shared session." />
        </label>

        <div className="action-row">
          <button
            className="ghost-button"
            type="button"
            disabled={Boolean(actionLoading)}
            onClick={async () => {
              setActionLoading('saveBulkDraft');
              await runAction(() => api.saveBulkDraft({ sessionToken, batchId: batch.batchId, checklist, notes }), 'Bulk draft saved.');
              setActionLoading('');
            }}
          >
            <ButtonSpinnerLabel loading={actionLoading === 'saveBulkDraft'} loadingLabel="Saving draft...">
              Save bulk draft
            </ButtonSpinnerLabel>
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={!checklistComplete || Boolean(actionLoading) || loadingStudents || hasUnsavedEmailChanges || hasMissingStudentEmails}
            onClick={async () => {
              setActionLoading('generateBulkOtps');
              await runAction(() => api.generateBulkOtps({ sessionToken, batchId: batch.batchId, checklist, notes }), 'Individual OTP emails sent.');
              setActionLoading('');
            }}
          >
            <ButtonSpinnerLabel loading={actionLoading === 'generateBulkOtps'} loadingLabel="Sending OTPs...">
              Send individual OTP emails
            </ButtonSpinnerLabel>
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={Boolean(actionLoading) || loadingStudents || hasUnsavedEmailChanges || hasMissingStudentEmails}
            onClick={async () => {
              setActionLoading('resendBulkOtp');
              await runAction(() => api.resendBulkOtp({ sessionToken, batchId: batch.batchId }), 'Pending OTPs resent.');
              setActionLoading('');
            }}
          >
            <ButtonSpinnerLabel loading={actionLoading === 'resendBulkOtp'} loadingLabel="Resending OTPs...">
              Resend pending OTPs
            </ButtonSpinnerLabel>
          </button>
        </div>

        {hasUnsavedEmailChanges ? <p className="muted">Save updated student emails before sending OTPs.</p> : null}
        {!hasUnsavedEmailChanges && hasMissingStudentEmails ? <p className="muted">Every selected student needs a valid email before OTP can be sent.</p> : null}

        <div className="otp-matrix">
          {(batch.regnos || []).map((regno) => (
            <label className="field compact" key={regno}>
              <span>
                {students.find((student) => student.regno === regno)?.studentName || regno}
                {' '}
                ({regno})
              </span>
              <input
                value={otpInputs[regno] || ''}
                onChange={(event) => updateOtp(regno, event.target.value)}
                placeholder="Student OTP"
              />
            </label>
          ))}
        </div>

        <button
          className="primary-button"
          type="button"
          disabled={Boolean(actionLoading)}
          onClick={async () => {
            setActionLoading('verifyBulkOtps');
            const verifications = (batch.regnos || [])
              .filter((regno) => otpInputs[regno])
              .map((regno) => ({ regno, otp: otpInputs[regno] }));

            const data = await runAction(
              () => api.verifyBulkOtps({ sessionToken, batchId: batch.batchId, verifications }),
              'Submitted provided OTPs.'
            );

            if (data?.completed) {
              setInfo('All students verified. Bulk boarding completed successfully.');
            }
            setActionLoading('');
          }}
        >
          <ButtonSpinnerLabel loading={actionLoading === 'verifyBulkOtps'} loadingLabel="Verifying OTPs...">
            Verify submitted OTPs
          </ButtonSpinnerLabel>
        </button>
      </section>
    </div>
  );
}
