import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getUserByName, blockUser, reportUser } from '../services/api';
import BoxDisplay from '../components/BoxDisplay';
import SendItemModal from '../components/SendItemModal';

export default function BoxPage() {
  const { username }  = useParams();
  const { dbUser }    = useAuth();
  const { t }         = useTranslation();
  const navigate      = useNavigate();

  const [boxUser,      setBoxUser]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showSend,     setShowSend]     = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting,    setReporting]    = useState(false);

  // Determine whose box to show
  const targetUsername = username || dbUser?.username;
  const isOwnBox = !username || username === dbUser?.username;

  useEffect(() => {
    if (!targetUsername) return;

    if (isOwnBox && dbUser) {
      setBoxUser(dbUser);
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserByName(targetUsername)
      .then(({ data }) => setBoxUser(data))
      .catch(() => {
        toast.error('User not found');
        navigate('/search');
      })
      .finally(() => setLoading(false));
  }, [targetUsername]);

  const handleBlock = async () => {
    if (!confirm(`Block @${boxUser.username}?`)) return;
    try {
      await blockUser(boxUser.id);
      toast.success(`@${boxUser.username} blocked.`);
      navigate('/search');
    } catch {
      toast.error(t('error_generic'));
    }
  };

  const handleReport = async () => {
    setReporting(true);
    try {
      await reportUser(boxUser.id, reportReason);
      toast.success('Report submitted.');
      setShowReport(false);
      setReportReason('');
    } catch {
      toast.error(t('error_generic'));
    } finally {
      setReporting(false);
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!boxUser) return null;

  return (
    <div className="page-centered">
      {/* Box visual */}
      <BoxDisplay user={boxUser} />

      {/* User info */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.3rem' }}>{boxUser.display_name}</h2>
        <p style={{ color: 'var(--brown-light)', fontSize: '0.85rem' }}>@{boxUser.username}</p>
        {boxUser.bio && (
          <p style={{ maxWidth: '340px', margin: '0.6rem auto 0', fontSize: '0.9rem', color: 'var(--brown-mid)', lineHeight: 1.65 }}>
            {boxUser.bio}
          </p>
        )}
      </div>

      <div className="divider" style={{ width: '100%', maxWidth: 400 }} />

      {/* Actions */}
      {isOwnBox ? (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/inbox')}>
            ✉️ {t('box.view_inbox')}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
            ✏️ {t('box.edit_box')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-brass btn-lg" onClick={() => setShowSend(true)}>
            📬 {t('box.send_item')}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleBlock}>
            🚫 {t('block')}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowReport(true)}>
            ⚑ {t('report')}
          </button>
        </div>
      )}

      {/* Send modal */}
      {showSend && (
        <SendItemModal
          receiver={boxUser}
          onClose={() => setShowSend(false)}
          onSent={() => setShowSend(false)}
        />
      )}

      {/* Report modal */}
      {showReport && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowReport(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>⚑ {t('report')} @{boxUser.username}</h2>
              <button className="modal-close" onClick={() => setShowReport(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('report_reason')}</label>
                <textarea
                  className="textarea"
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder="Describe the issue..."
                  maxLength={500}
                />
              </div>
              <button
                className="btn btn-danger btn-block"
                onClick={handleReport}
                disabled={reporting || !reportReason.trim()}
              >
                {reporting ? '...' : t('report_submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
