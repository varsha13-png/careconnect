import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const getPosts = () => API.get('/posts');
const likePost = (postId) => API.put(`/posts/${postId}/like`);
const createPost = (data) => API.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
const browseHomes = () => API.get('/homes/browse');
const getPublicNeeds = () => API.get('/needs/public');

const timeAgo = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function DonorHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [homes, setHomes] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [selectedHome, setSelectedHome] = useState(null);
  const [donateNeed, setDonateNeed] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([getPosts(), browseHomes(), getPublicNeeds()])
      .then(([pRes, hRes, nRes]) => {
        setPosts(pRes.data.data);
        setHomes(hRes.data.data);
        setNeeds(nRes.data.data);
      })
      .catch(() => toast.error('Failed to load feed'))
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (postId) => {
    try {
      const res = await likePost(postId);
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, likes_count: res.data.data.likes_count, isLiked: res.data.data.isLiked }
        : p
      ));
    } catch {}
  };

  const handlePost = async () => {
    if (!content.trim()) return toast.error('Write something first!');
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      // donors post to their most recently donated home or a general post
      if (user?.home_id) formData.append('home_id', user.home_id);
      if (image) formData.append('image', image);
      const res = await createPost(formData);
      setPosts(prev => [res.data.data, ...prev]);
      setContent('');
      setImage(null);
      setImagePreview(null);
      setShowCreate(false);
      toast.success('Posted!');
    } catch { toast.error('Failed to post'); }
    setPosting(false);
  };

  const urgencyColor = (u) => u === 'critical' ? '#E24B4A' : u === 'medium' ? '#BA7517' : '#1D9E75';

  const getHomeNeeds = (homeId) => needs.filter(n => n.home_id?._id === homeId || n.home_id === homeId);

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Top header */}
      <div style={{ background: '#fff', padding: '14px 20px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#D4537E', letterSpacing: '-0.3px' }}>Care Connect</div>
          <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Dignity. Care. Community.</div>
        </div>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#D4537E', cursor: 'pointer' }}
          onClick={() => navigate('/donor-profile')}>
          {user?.name?.[0] || '?'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Homes stories row */}
        <div style={{ background: '#fff', borderBottom: '0.5px solid #f0f0f0', padding: '14px 0' }}>
          <div style={{ paddingLeft: '16px', marginBottom: '10px', fontSize: '12px', fontWeight: '600', color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Homes near you</div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '0 16px', paddingBottom: '4px' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px' }}><Spinner size={20} /></div>
            ) : homes.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#9e9e9e', padding: '10px' }}>No homes found nearby</div>
            ) : homes.map(home => {
              const homeNeeds = getHomeNeeds(home._id);
              const hasUrgent = homeNeeds.some(n => n.urgency === 'critical');
              return (
                <div key={home._id} onClick={() => setSelectedHome(selectedHome?._id === home._id ? null : home)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0, minWidth: '68px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: hasUrgent ? '#FCEBEB' : '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: `2px solid ${selectedHome?._id === home._id ? '#D4537E' : hasUrgent ? '#E24B4A' : '#f0f0f0'}` }}>
                    🏠
                  </div>
                  <div style={{ fontSize: '10px', color: '#212121', fontWeight: '500', textAlign: 'center', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home.name.split(' ')[0]}</div>
                  {hasUrgent && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E24B4A', marginTop: '-4px' }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected home expanded card */}
        {selectedHome && (
          <div style={{ background: '#fff', borderBottom: '0.5px solid #f0f0f0', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏠</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedHome.name}</div>
                <div style={{ fontSize: '12px', color: '#9e9e9e' }}>{selectedHome.city} · {selectedHome.type === 'old_age_home' ? 'Old age home' : 'Orphanage'}</div>
              </div>
              <button onClick={() => setSelectedHome(null)}
                style={{ background: 'none', border: 'none', color: '#9e9e9e', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            {getHomeNeeds(selectedHome._id).length === 0 ? (
              <div style={{ fontSize: '13px', color: '#9e9e9e', textAlign: 'center', padding: '10px' }}>No open needs right now</div>
            ) : (
              <>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#9e9e9e', marginBottom: '8px' }}>Open needs</div>
                {getHomeNeeds(selectedHome._id).slice(0, 3).map(need => (
                  <div key={need._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f8f8f8', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}
                    onClick={() => navigate('/donate', { state: { need, home: selectedHome } })}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: urgencyColor(need.urgency), flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{need.item_name}</div>
                      <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{need.quantity_required - need.quantity_fulfilled} {need.unit} needed</div>
                    </div>
                    <div style={{ height: '28px', padding: '0 12px', borderRadius: '8px', background: '#D4537E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#fff', fontWeight: '500' }}>Donate</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Create post bar */}
        <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#D4537E', flexShrink: 0 }}>
              {user?.name?.[0] || '?'}
            </div>
            <div onClick={() => setShowCreate(true)}
              style={{ flex: 1, height: '38px', borderRadius: '999px', background: '#f8f8f8', border: '0.5px solid #e0e0e0', display: 'flex', alignItems: 'center', padding: '0 16px', cursor: 'pointer' }}>
              <span style={{ fontSize: '13px', color: '#9e9e9e' }}>Share something...</span>
            </div>
          </div>
        </div>

        {/* Create post expanded */}
        {showCreate && (
          <div style={{ background: '#fff', borderBottom: '0.5px solid #f0f0f0', padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#D4537E', flexShrink: 0 }}>
                {user?.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#212121' }}>{user?.name}</div>
                <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Donor</div>
              </div>
              <button onClick={() => { setShowCreate(false); setContent(''); setImage(null); setImagePreview(null); }}
                style={{ background: 'none', border: 'none', color: '#9e9e9e', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Share your experience, a visit, or encourage others to donate..."
              maxLength={500} autoFocus
              style={{ width: '100%', minHeight: '80px', border: 'none', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7, color: '#212121', background: 'transparent' }} />
            {imagePreview && (
              <div style={{ position: 'relative', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => { setImage(null); setImagePreview(null); }}
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '0.5px solid #f0f0f0' }}>
              <button onClick={() => fileRef.current.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '32px', padding: '0 12px', borderRadius: '8px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '12px', color: '#757575', cursor: 'pointer' }}>
                📷 Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if(f){ setImage(f); setImagePreview(URL.createObjectURL(f)); }}} style={{ display: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: '#9e9e9e' }}>{content.length}/500</span>
                <button onClick={handlePost} disabled={!content.trim() || posting}
                  style={{ height: '34px', padding: '0 18px', borderRadius: '999px', background: content.trim() ? '#D4537E' : '#e0e0e0', border: 'none', color: content.trim() ? '#fff' : '#9e9e9e', fontSize: '13px', fontWeight: '500', cursor: content.trim() ? 'pointer' : 'default' }}>
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feed posts */}
        <div style={{ padding: '8px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={32} /></div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '40px 20px' }}>
              <EmptyState icon="📰" title="No posts yet" subtitle="Homes will share updates here soon!" />
            </div>
          ) : posts.map(post => (
            <div key={post._id} style={{ background: '#fff', borderBottom: '0.5px solid #f0f0f0', marginBottom: '8px' }}>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏠</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#212121' }}>{post.home_id?.name || 'Unknown Home'}</span>
                    {(post.home_id?.verification_status === 'level1' || post.home_id?.verification_status === 'level2') && (
                      <span style={{ fontSize: '10px', color: '#085041', background: '#E1F5EE', padding: '2px 6px', borderRadius: '999px', fontWeight: '500' }}>✓ Verified</span>
                    )}
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: '500', background: post.home_id?.type === 'old_age_home' ? '#FBEAF0' : '#E6F1FB', color: post.home_id?.type === 'old_age_home' ? '#72243E' : '#0C447C' }}>
                      {post.home_id?.type === 'old_age_home' ? 'Old age home' : 'Orphanage'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '2px' }}>{post.home_id?.city} · {timeAgo(post.created_at)}</div>
                </div>
              </div>
              <div style={{ padding: '0 16px 12px' }}>
                <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#212121', margin: 0 }}>{post.content}</p>
              </div>
              {post.image_url && (
                <img src={post.image_url} alt="Post" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: '10px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #f9f5f7' }}>
                <button onClick={() => handleLike(post._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', background: post.isLiked ? '#FBEAF0' : 'transparent', border: `0.5px solid ${post.isLiked ? '#ED93B1' : '#e0e0e0'}`, borderRadius: '999px', padding: '7px 16px', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={post.isLiked ? '#D4537E' : 'none'} stroke={post.isLiked ? '#D4537E' : '#9e9e9e'} strokeWidth="2" strokeLinecap="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span style={{ fontSize: '13px', color: post.isLiked ? '#D4537E' : '#9e9e9e', fontWeight: post.isLiked ? '500' : '400' }}>
                    {post.likes_count > 0 ? `${post.likes_count} ` : ''}Like{post.likes_count !== 1 ? 's' : ''}
                  </span>
                </button>
                {/* Donate button on post if home has needs */}
                {getHomeNeeds(post.home_id?._id).length > 0 && (
                  <button onClick={() => setSelectedHome(homes.find(h => h._id === post.home_id?._id))}
                    style={{ height: '34px', padding: '0 16px', borderRadius: '999px', background: '#FBEAF0', border: '0.5px solid #ED93B1', color: '#D4537E', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                    💝 Donate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {[
          { id: 'home', label: 'Home', icon: '🏠', path: '/browse' },
          { id: 'notifications', label: 'Needs', icon: '🔔', path: '/needs-feed' },
          { id: 'profile', label: 'Profile', icon: '👤', path: '/donor-profile' }
        ].map(item => (
          <div key={item.id} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: item.id === 'home' ? '#D4537E' : '#9e9e9e', fontWeight: item.id === 'home' ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
