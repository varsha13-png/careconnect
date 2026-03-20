import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboard, getAlerts, markAlertDone, snoozeAlert } from '../services/api';
import API from '../services/api';
import { Card, Badge, ProgressBar, Avatar, SectionHeader, Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const getPosts = () => API.get('/posts');
const createPost = (data) => API.post('/posts', data);
const likePost = (postId) => API.put(`/posts/${postId}/like`);

const timeAgo = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NavBar = ({ active, onNav }) => {
  const items = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'needs', label: 'Needs & Donations', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];
  return (
    <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px' }}>
      {items.map(item => (
        <div key={item.id} onClick={() => onNav(item.id)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
          <span style={{ fontSize: '18px' }}>{item.icon}</span>
          <span style={{ fontSize: '9px', color: active === item.id ? '#D4537E' : '#9e9e9e', fontWeight: active === item.id ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const QuickAction = ({ icon, label, color, onClick }) => (
  <div onClick={onClick}
    style={{ background: '#fff', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '0.5px solid #f0f0f0' }}>
    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
      {icon}
    </div>
    <span style={{ fontSize: '12px', fontWeight: '500', color: '#212121', lineHeight: 1.4 }}>{label}</span>
  </div>
);

const AlertCard = ({ alert, onDone, onSnooze }) => {
  const isOverdue = new Date(alert.scheduled_at) < new Date();
  const urgencyColor = alert.status === 'done' ? '#1D9E75' : isOverdue ? '#E24B4A' : '#BA7517';
  const badgeVariant = alert.status === 'done' ? 'fulfilled' : isOverdue ? 'critical' : 'medium';
  const badgeText = alert.status === 'done' ? 'Completed' : isOverdue ? 'Overdue' : 'Pending';
  return (
    <Card style={{ borderLeft: `3px solid ${urgencyColor}`, borderRadius: '0 14px 14px 0', opacity: alert.status === 'done' ? 0.7 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#212121', flex: 1 }}>{alert.title}</div>
        <span style={{ fontSize: '11px', color: '#9e9e9e', flexShrink: 0 }}>
          {new Date(alert.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#9e9e9e', marginBottom: '8px' }}>
        {alert.member_id?.name}, {alert.member_id?.age} · Member
      </div>
      <Badge variant={badgeVariant}>{badgeText}</Badge>
      {alert.status !== 'done' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button onClick={() => onSnooze(alert._id)}
            style={{ flex: 1, height: '32px', borderRadius: '8px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '11px', color: '#757575', cursor: 'pointer' }}>
            Snooze 30m
          </button>
          <button onClick={() => onDone(alert._id)}
            style={{ flex: 2, height: '32px', borderRadius: '8px', border: 'none', background: '#D4537E', color: '#fff', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}>
            Mark done
          </button>
        </div>
      )}
    </Card>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('profile');
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (user?.home_id) {
      Promise.all([
        getDashboard(user.home_id),
        getAlerts(user.home_id, { date: new Date().toISOString().split('T')[0] })
      ]).then(([dashRes, alertRes]) => {
        setData(dashRes.data.data);
        setAlerts(alertRes.data.data);
      }).catch(() => toast.error('Failed to load dashboard'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    getPosts()
      .then(res => setPosts(res.data.data))
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, [user]);

  const handleNav = (id) => {
    setActiveNav(id);
    if (id === 'home') navigate('/dashboard');
    if (id === 'members') navigate('/members');
    if (id === 'alerts') navigate('/alerts');
    if (id === 'needs') navigate('/needs');
  };

  const handleDone = async (alertId) => {
    try {
      await markAlertDone(user.home_id, alertId);
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'done' } : a));
      toast.success('Marked as done!');
    } catch { toast.error('Failed to update alert'); }
  };

  const handleSnooze = async (alertId) => {
    try {
      await snoozeAlert(user.home_id, alertId);
      toast.success('Snoozed for 30 minutes');
    } catch { toast.error('Failed to snooze'); }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    try {
      const res = await createPost({ content: postContent, home_id: user.home_id });
      setPosts(prev => [res.data.data, ...prev]);
      setPostContent('');
      setShowPostForm(false);
      toast.success('Post shared!');
    } catch { toast.error('Failed to post'); }
    setPosting(false);
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await likePost(postId);
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, likes_count: res.data.data.likes_count, isLiked: res.data.data.isLiked }
        : p
      ));
    } catch {}
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner size={32} />
    </div>
  );

  const todayAlerts = alerts.slice(0, 3);
  const openNeeds = data?.openNeeds || 0;

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Pink Header */}
      <div style={{ background: '#D4537E', padding: '16px 24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>{user?.home_id?.name || 'Your Home'}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
              Good morning, {user?.name?.split(' ')[0]} 👋
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/settings')}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⚙️
            </button>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              🔔
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FAEEDA', position: 'absolute', top: '6px', right: '6px', border: '1.5px solid #D4537E' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { num: data?.memberCount || 0, label: 'Members' },
            { num: data?.alertsToday || 0, label: 'Alerts today', highlight: true },
            { num: openNeeds, label: 'Open needs' }
          ].map((m, i) => (
            <div key={i} style={{ background: m.highlight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '600', color: '#fff', lineHeight: 1 }}>{m.num}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <QuickAction icon="👤" label="Add care worker" color="#E6F1FB" onClick={() => navigate('/workers/invite')} />
          <QuickAction icon="📊" label="View reports" color="#FAEEDA" onClick={() => navigate('/reports')} />
        </div>

        {/* Today's alerts */}
        <SectionHeader title="Today's alerts" action="See all" onAction={() => navigate('/alerts')} />
        {todayAlerts.length === 0
          ? <EmptyState icon="✅" title="All clear!" subtitle="No alerts for today" />
          : todayAlerts.map(a => <AlertCard key={a._id} alert={a} onDone={handleDone} onSnooze={handleSnooze} />)
        }

        {/* Open needs */}
        <SectionHeader title="Open needs" action="See all" onAction={() => navigate('/needs')} />
        {(data?.openNeedsList || []).slice(0, 2).map(n => (
          <Card key={n._id} style={{ borderLeft: `3px solid ${n.urgency === 'critical' ? '#E24B4A' : '#BA7517'}`, borderRadius: '0 14px 14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>{n.item_name}</span>
              <Badge variant={n.urgency}>{n.urgency}</Badge>
            </div>
            <ProgressBar value={n.quantity_fulfilled} max={n.quantity_required} color={n.urgency === 'critical' ? '#E24B4A' : '#BA7517'} />
          </Card>
        ))}
        {!data?.openNeedsList?.length && <EmptyState icon="📋" title="No open needs" subtitle="Post a need to let donors help" />}

        {/* Recent donations */}
        <SectionHeader title="Recent donations" action="See all" onAction={() => navigate('/needs?tab=donations')} />
        {(data?.recentDonations || []).slice(0, 2).map(d => (
          <Card key={d._id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar name={d.is_anonymous ? 'Anonymous' : d.donor_id?.name || '?'} size={38} color={d.is_anonymous ? '#E6F1FB' : '#FBEAF0'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{d.is_anonymous ? 'Anonymous' : d.donor_id?.name}</div>
                <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{d.need_id?.item_name}</div>
              </div>
              {d.type === 'money' && <span style={{ fontSize: '13px', fontWeight: '600', color: '#D4537E' }}>₹{d.amount?.toLocaleString()}</span>}
            </div>
          </Card>
        ))}
        {!data?.recentDonations?.length && <EmptyState icon="💝" title="No donations yet" subtitle="Share your needs to attract donors" />}

        {/* Staff on duty */}
        <SectionHeader title="Staff on duty" action="Manage" onAction={() => navigate('/workers')} />
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {(data?.workers || []).map(w => (
            <div key={w._id} style={{ background: '#fff', borderRadius: '12px', padding: '12px', minWidth: '100px', textAlign: 'center', border: '0.5px solid #f0f0f0', flexShrink: 0 }}>
              <Avatar name={w.name} size={36} color={w.is_active ? '#D4537E' : '#9e9e9e'} />
              <div style={{ fontSize: '11px', fontWeight: '500', marginTop: '8px' }}>{w.name.split(' ')[0]}</div>
              <div style={{ fontSize: '10px', color: '#9e9e9e', marginTop: '2px' }}>
                {w.is_active && <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', marginRight: '3px' }} />}
                {w.shift}
              </div>
            </div>
          ))}
        </div>
        {!data?.workers?.length && <EmptyState icon="👥" title="No staff added yet" subtitle="Invite care workers to get started" />}



      </div>
      <NavBar active={activeNav} onNav={handleNav} />
    </div>
  );
}