import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Spinner, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

const getPosts = () => API.get('/posts');
const createPost = (data) => API.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
const likePost = (postId) => API.put(`/posts/${postId}/like`);
const deletePost = (postId) => API.delete(`/posts/${postId}`);

const timeAgo = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    getPosts()
      .then(res => setPosts(res.data.data))
      .catch(() => toast.error('Failed to load feed'))
      .finally(() => setLoading(false));
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    if (!content.trim()) return toast.error('Write something first!');
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('home_id', user.home_id);
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

  const handleLike = async (postId) => {
    try {
      const res = await likePost(postId);
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, likes_count: res.data.data.likes_count, isLiked: res.data.data.isLiked }
        : p
      ));
    } catch {}
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const navItems = user?.role === 'donor'
    ? [
        { id: 'browse', label: 'Browse', icon: '🏠', path: '/browse' },
        { id: 'donations', label: 'My donations', icon: '💝', path: '/donor-profile' },
        { id: 'profile', label: 'Profile', icon: '👤', path: '/donor-profile' }
      ]
    : [
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'members', label: 'Members', icon: '👥' },
        { id: 'alerts', label: 'Alerts', icon: '🔔' },
        { id: 'needs', label: 'Needs', icon: '📋' },
        { id: 'profile', label: 'Profile', icon: '👤' }
      ];

  const handleNav = (id) => {
    if (id === 'members') navigate('/members');
    else if (id === 'alerts') navigate('/alerts');
    else if (id === 'needs') navigate('/needs');
    else if (id === 'profile') navigate('/profile');
    else if (id === 'browse') navigate('/browse');
    else if (id === 'donations') navigate('/donor-profile');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Top header */}
      <div style={{ background: '#fff', padding: '14px 20px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#D4537E', letterSpacing: '-0.3px' }}>Care Connect</div>
          <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Dignity. Care. Community.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4537E" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><line x1="13.73" y1="21" x2="10.27" y2="21"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Scrollable feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Create post bar */}
        <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#D4537E', flexShrink: 0 }}>
              {user?.name?.[0] || '?'}
            </div>
            <div onClick={() => setShowCreate(true)}
              style={{ flex: 1, height: '40px', borderRadius: '999px', background: '#f8f8f8', border: '0.5px solid #e0e0e0', display: 'flex', alignItems: 'center', padding: '0 16px', cursor: 'pointer' }}>
              <span style={{ fontSize: '13px', color: '#9e9e9e' }}>Share an update about your home...</span>
            </div>
            <div onClick={() => { setShowCreate(true); fileRef.current?.click(); }}
              style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f8f8f8', border: '0.5px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Create post expanded */}
        {showCreate && (
          <div style={{ background: '#fff', borderBottom: '0.5px solid #f0f0f0', padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#D4537E', flexShrink: 0 }}>
                {user?.name?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#212121', marginBottom: '2px' }}>{user?.name}</div>
                <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{user?.home_id?.name || 'Your home'}</div>
              </div>
              <button onClick={() => { setShowCreate(false); setContent(''); setImage(null); setImagePreview(null); }}
                style={{ background: 'none', border: 'none', color: '#9e9e9e', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="What's happening at your home today? Share a moment, a milestone or a thank you..."
              maxLength={500} autoFocus
              style={{ width: '100%', minHeight: '100px', border: 'none', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7, color: '#212121', background: 'transparent' }} />
            {imagePreview && (
              <div style={{ position: 'relative', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => { setImage(null); setImagePreview(null); }}
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '0.5px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => fileRef.current.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '32px', padding: '0 12px', borderRadius: '8px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '12px', color: '#757575', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
              </div>
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

        {/* Feed */}
        <div style={{ padding: '8px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Spinner size={32} /></div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '40px 20px' }}>
              <EmptyState icon="📰" title="No posts yet" subtitle="Be the first to share an update from your home!" />
            </div>
          ) : (
            posts.map(post => (
              <div key={post._id} style={{ background: '#fff', borderBottom: '0.5px solid #f0f0f0', marginBottom: '8px' }}>

                {/* Post header */}
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
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '2px' }}>
                      {post.home_id?.city} · {timeAgo(post.created_at)}
                    </div>
                  </div>
                  {post.author_id === user?._id && (
                    <button onClick={() => handleDelete(post._id)}
                      style={{ background: 'none', border: 'none', color: '#9e9e9e', cursor: 'pointer', fontSize: '18px', padding: '4px' }}>···</button>
                  )}
                </div>

                {/* Post content */}
                <div style={{ padding: '0 16px 12px' }}>
                  <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#212121', margin: 0 }}>{post.content}</p>
                </div>

                {/* Post image */}
                {post.image_url && (
                  <img src={post.image_url} alt="Post" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', display: 'block' }} />
                )}

                {/* Like bar */}
                <div style={{ padding: '10px 16px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '0.5px solid #f9f5f7' }}>
                  <button onClick={() => handleLike(post._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', background: post.isLiked ? '#FBEAF0' : 'transparent', border: `0.5px solid ${post.isLiked ? '#ED93B1' : '#e0e0e0'}`, borderRadius: '999px', padding: '7px 16px', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={post.isLiked ? '#D4537E' : 'none'} stroke={post.isLiked ? '#D4537E' : '#9e9e9e'} strokeWidth="2" strokeLinecap="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span style={{ fontSize: '13px', color: post.isLiked ? '#D4537E' : '#9e9e9e', fontWeight: post.isLiked ? '500' : '400' }}>
                      {post.likes_count > 0 ? `${post.likes_count} ` : ''}Like{post.likes_count !== 1 ? 's' : ''}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => handleNav(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: item.id === 'home' || item.id === 'browse' ? '#9e9e9e' : '#9e9e9e', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}