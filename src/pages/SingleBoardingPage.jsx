import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

export default function SingleBoardingPage() {
  const { regno } = useParams();
  const { sessionToken } = useSession();
  const [student, setStudent] = useState(null);
  const [checklist, setChecklist] = useState(buildEmptyChecklist);
  const [notes, setNotes] = useState('');
  const [otp, setOtp] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      setLoading(true);
      try {
        const detail = await api.getStudent({ sessionToken, regno });
        const draftChecklist = detail.draft?.checklist || buildEmptyChecklist();
        const draftNotes = detail.draft?.notes || '';
        let currentStudent = detail.student;

        if (currentStudent.status !== 'COMPLETED' && !currentStudent.boardingStartedAt) {
          const started = await api.startBoarding({ sessionToken, regno });
          currentStudent = started.student;
        }

        if (active) {
          setStudent(currentStudent);
          setChecklist({ ...buildEmptyChecklist(), ...draftChecklist });
          setNotes(draftNotes);
          setStudentEmail(currentStudent.studentEmail || '');
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

    loadStudent();
    return () => {
      active = false;
    };
  }, [regno, sessionToken]);

  useEffect(() => {
    if (!student?.boardingStartedAt) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const startedAt = new Date(student.boardingStartedAt);
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [student?.boardingStartedAt]);

  const checklistComplete = CHECKLIST_ITEMS.every((item) => checklist[item.key] === 'YES' || checklist[item.key] === 'NO');

  function updateChecklist(key, value) {
    setChecklist((current) => ({ ...current, [key]: value }));
  }

  function markAllYes() {
    setChecklist(buildAllYesChecklist());
  }

  function clearAllChecklist() {
    setChecklist(buildEmptyChecklist());
  }

  function isEmailChanged() {
    return String(studentEmail || '').trim().toLowerCase() !== String(student?.studentEmail || '').trim().toLowerCase();
  }

  async function handleAction(actionKey, fn, successMessage) {
    setError('');
    setInfo('');
    setActionLoading(actionKey);
    try {
      const data = await fn();
      if (data.student) {
        setStudent(data.student);
        setStudentEmail(data.student.studentEmail || '');
      }
      setInfo(data.message || successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  }

  const elapsedMinutes = Math.floor(elapsed / 60);
  const elapsedSeconds = elapsed % 60;

  return (
    <div className="stack">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Single Student Boarding</h2>
            <p>Capture the session, save draft, send OTP, and verify to close the student record.</p>
          </div>
          <div className="timer-badge">
            {String(elapsedMinutes).padStart(2, '0')}:{String(elapsedSeconds).padStart(2, '0')}
          </div>
        </div>

        {loading ? <LoadingPanel label="Loading student record..." /> : null}
        {student ? (
          <>
            <div className="student-summary">
              <div><span>Reg No</span><strong>{student.regno}</strong></div>
              <div><span>Student</span><strong>{student.studentName}</strong></div>
              <div><span>Status</span><strong>{student.status}</strong></div>
              <div><span>Course</span><strong>{student.course}</strong></div>
            </div>

            <div className="inline-edit-card">
              <label className="field compact flex-grow">
                <span>Student Email</span>
                <input
                  value={studentEmail}
                  onChange={(event) => setStudentEmail(event.target.value)}
                  placeholder="student@email.com"
                  disabled={loading || Boolean(actionLoading)}
                />
              </label>
              <button
                className="ghost-button"
                type="button"
                disabled={loading || Boolean(actionLoading) || !isEmailChanged()}
                onClick={() => handleAction(
                  'updateEmail',
                  () => api.updateStudentEmail({ sessionToken, regno, studentEmail }),
                  'Student email updated.'
                )}
              >
                <ButtonSpinnerLabel loading={actionLoading === 'updateEmail'} loadingLabel="Saving email...">
                  Save email
                </ButtonSpinnerLabel>
              </button>
            </div>
          </>
        ) : null}

        {error ? <p className="error-banner">{error}</p> : null}
        {info ? <p className="info-banner">{info}</p> : null}
      </section>

      <ChecklistEditor
        checklist={checklist}
        onChange={updateChecklist}
        onMarkAllYes={markAllYes}
        onClearAll={clearAllChecklist}
        title="21 Mandatory Checklist Points"
        subtitle="Every item must be marked Yes or No before OTP can be generated."
      />

      <section className="card">
          <div className="section-heading">
          <div>
            <h2>Notes & OTP</h2>
            <p>Draft save is available before OTP. OTP can only be sent after the full checklist and 10-minute minimum are satisfied.</p>
          </div>
        </div>

        <label className="field">
          <span>Session notes</span>
          <textarea rows="5" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add anything the admin team may need later." />
        </label>

        <div className="action-row">
          <button
            className="ghost-button"
            type="button"
            disabled={loading || Boolean(actionLoading)}
            onClick={() => handleAction('draft', () => api.saveDraft({ sessionToken, regno, checklist, notes }), 'Draft saved.')}
          >
            <ButtonSpinnerLabel loading={actionLoading === 'draft'} loadingLabel="Saving draft...">
              Save draft
            </ButtonSpinnerLabel>
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={!checklistComplete || loading || Boolean(actionLoading) || !studentEmail || isEmailChanged()}
            onClick={() => handleAction('generateOtp', () => api.generateOtp({ sessionToken, regno, checklist, notes }), 'OTP sent.')}
          >
            <ButtonSpinnerLabel loading={actionLoading === 'generateOtp'} loadingLabel="Sending OTP...">
              Generate OTP
            </ButtonSpinnerLabel>
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={loading || Boolean(actionLoading) || !studentEmail || isEmailChanged()}
            onClick={() => handleAction('resendOtp', () => api.resendOtp({ sessionToken, regno }), 'OTP resent.')}
          >
            <ButtonSpinnerLabel loading={actionLoading === 'resendOtp'} loadingLabel="Resending OTP...">
              Resend OTP
            </ButtonSpinnerLabel>
          </button>
        </div>

        {isEmailChanged() ? <p className="muted">Save the updated student email before generating OTP.</p> : null}

        <div className="otp-row">
          <label className="field compact flex-grow">
            <span>Enter OTP</span>
            <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="4-digit OTP" />
          </label>
          <button
            className="primary-button"
            type="button"
            disabled={!otp || loading || Boolean(actionLoading)}
            onClick={() => handleAction('verifyOtp', () => api.verifyOtp({ sessionToken, regno, otp }), 'Boarding completed.')}
          >
            <ButtonSpinnerLabel loading={actionLoading === 'verifyOtp'} loadingLabel="Verifying OTP...">
              Complete boarding
            </ButtonSpinnerLabel>
          </button>
        </div>
      </section>
    </div>
  );
}
