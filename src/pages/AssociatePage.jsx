import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ButtonSpinnerLabel, LoadingPanel } from '../components/Spinner';
import { api } from '../services/api';
import { useSession } from '../context/SessionContext';

export default function AssociatePage() {
  const navigate = useNavigate();
  const { sessionToken, setAssociate } = useSession();
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState('');
  const [error, setError] = useState('');
  const [associates, setAssociates] = useState([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState('');

  useEffect(() => {
    let active = true;

    async function loadAssociates() {
      try {
        const data = await api.getAssociates(sessionToken);
        if (active) {
          setAssociates(data.associates || []);
          if (data.associates?.length) {
            setSelectedAssociateId(data.associates[0].associateId);
          }
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

    loadAssociates();
    return () => {
      active = false;
    };
  }, [sessionToken]);

  async function handleSelect() {
    const associate = associates.find((item) => item.associateId === selectedAssociateId);
    if (!associate) {
      return;
    }

    setError('');
    setSelectingId(associate.associateId);
    try {
      const data = await api.selectAssociate({
        sessionToken,
        associateId: associate.associateId
      });
      setAssociate(data);
      navigate('/queue');
    } catch (err) {
      setError(err.message);
    } finally {
      setSelectingId('');
    }
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Select Associate</h2>
          <p>Choose who is actually performing the student boarding work in this branch session.</p>
        </div>
      </div>

      {loading ? <LoadingPanel label="Loading associates..." /> : null}
      {error ? <p className="error-banner">{error}</p> : null}

      <div className="stack">
        <label className="field">
          <span>Associate</span>
          <select
            value={selectedAssociateId}
            onChange={(event) => setSelectedAssociateId(event.target.value)}
            disabled={loading || Boolean(selectingId)}
          >
            {associates.map((associate) => (
              <option key={associate.associateId} value={associate.associateId}>
                {associate.associateName} ({associate.branchCode})
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="primary-button"
          disabled={loading || Boolean(selectingId) || !selectedAssociateId}
          onClick={handleSelect}
        >
          <ButtonSpinnerLabel loading={Boolean(selectingId)} loadingLabel="Opening...">
            Continue to queue
          </ButtonSpinnerLabel>
        </button>
      </div>
    </section>
  );
}
