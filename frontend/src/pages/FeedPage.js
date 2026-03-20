import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Spinner, EmptyState, Avatar } from '../components/UI';
import toast from 'react-hot-toast';

const getPosts = (params) => API.get('/posts', { params });
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

const HomeTypeBadge = ({ type }) => (
  <span style={{
    fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: '500',
    background: type === 'old_age_home' ? '#FBEAF0' : '#E6F1FB',
    color: type === 'old_age_home' ? '#72243E' : '#0C447C'
  }}>
    {type === 'old_age_home' ? 'Old age home' : 'Orphanage'}
  </span>
);

const PostCard = ({ post, currentUserId, onLike, onDelete }) => {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    setLiked(!liked);
    setLikesCount(c => liked ? c - 1 : c + 1);
    try {
      await onLike(post._id);
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
    }
    setLiking(false);
  };

  const isOwner = post.author_id === currentUserId;

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '0.5px solid #f0f0f0', marginBottom: '14px', overflow: 'hidden' }}>

      {/* Post header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
          🏠
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#212121' }}>{post.home_id?.name || 'Unknown Home'}</span>
            {post.home_id?.verification_status === 'level1' || post.home_id?.verification_status === 'level2' ? (
              <span style={{ fontSize: '10px', color: '#085041', background: '#E1F5EE', padding: '1px 6px', borderRadius: '999px' }}>✓ Verified</span>
            ) : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <span style={{ fontSize: '11px', color: '#9e9e9e' }}>{post.home_id?.city}</span>
            <span style={{ fontSize: '11px', color: '#9e9e9e' }}>·</span>
            <span style={{ fontSize: '11px', color: '#9e9e9e' }}>{timeAgo(post.created_at)}</span>
            <HomeTypeBadge type={post.home_id?.type} />
          </div>
        </div>
        {isOwner && (
          <button onClick={() => onDelete(post._id)}
            style={{ background: 'none', border: 'none', color: '#9e9e9e', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>
            ···
          </button>
        )}
      </div>

      {/* Post content */}
      <div style={{ padding: '0 16px 12px' }}>
        <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#212121', margin: 0 }}>{post.content}</p>
      </div>

      {/* Post image */}
      {post.image_url && (
        <div style={{ width: '100%', maxHeight: '300px', overflow: 'hidden', background: '#f8f8f8' }}>
          <img src={post.image_url} alt="Post" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Like bar */}
      <div style={{ padding: '10px 16px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderTop: post.image_url ? '0.5px solid #f0f0f0' : 'none', marginTop: post.image_url ? '0' : '0' }}>
        <button onClick={handleLike}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', background: liked ? '#FBEAF0' : 'transparent',
            border: `0.5px solid ${liked ? '#ED93B1' : '#e0e0e0'}`, borderRadius: '999px',
            padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s'
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? '#D4537E' : 'none'} stroke={liked ? '#D4537E' : '#9e9e9e'} strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span style={{ fontSize: '12px', color: liked ? '#D4537E' : '#9e9e9e', fontWeight: liked ? '500' : '400' }}>
            {likesCount > 0 ? likesCount : ''} {likesCount === 1 ? 'Like' : likesCount > 1 ? 'Likes' : 'Like'}
          </span>
        </button>
      </div>
    </div>
  );
};

const CreatePostModal = ({ onClose, onPost, homeId }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return toast.error('Write something first!');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('home_id', homeId);
      if (image) formData.append('image', image);
      const res = await createPost(formData);
      onPost(res.data.data);
      onClose();
      toast.success('Post shared!');
    } catch {
      toast.error('Failed to post');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '420px', padding: '20px 20px 32px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>Share an update</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9e9e9e' }}>✕</button>
        </div>

        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share something about your home — a celebration, a milestone, a thank you..."
          maxLength={500}
          style={{
            width: '100%', minHeight: '120px', border: '0.5px solid #e0e0e0', borderRadius: '12px',
            padding: '12px', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
            resize: 'none', lineHeight: 1.7, color: '#212121', background: '#fff'
          }} />
        <div style={{ fontSize: '11px', color: '#9e9e9e', textAlign: 'right', marginTop: '4px', marginBottom: '14px' }}>
          {content.length}/500
        </div>

        {imagePreview && (
          <div style={{ position: 'relative', marginBottom: '14px', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
            <button onClick={() => { setImage(null); setImagePreview(null); }}
              style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => fileRef.current.click()}
            style={{ height: '46px', padding: '0 16px', borderRadius: '10px', border: '0.5px solid #e0e0e0', background: 'transparent', fontSize: '13px', color: '#757575', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />

          <button onClick={handleSubmit} disabled={loading || !content.trim()}
            style={{
              flex: 1, height: '46px', borderRadius: '10px', border: 'none',
              background: content.trim() ? '#D4537E' : '#e0e0e0',
              color: content.trim() ? '#fff' : '#9e9e9e',
              fontSize: '14px', fontWeight: '500', cursor: content.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Share post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FeedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeNav, setActiveNav] = useState('feed');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await getPosts();
      setPosts(res.data.data);
    } catch {
      toast.error('Failed to load feed');
    }
    setLoading(false);
  };

  const handleLike = async (postId) => {
    await likePost(postId);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleNewPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleNav = (id) => {
    setActiveNav(id);
    if (id === 'home') {
      if (user?.role === 'authority') navigate('/dashboard');
      else if (user?.role === 'donor') navigate('/browse');
    }
    if (id === 'members') navigate('/members');
    if (id === 'alerts') navigate('/alerts');
    if (id === 'needs') navigate('/needs');
    if (id === 'profile') navigate('/profile');
  };

  const navItems = user?.role === 'donor'
    ? [
        { id: 'browse', label: 'Browse', icon: '🏠' },
        { id: 'feed', label: 'Feed', icon: '📰' },
        { id: 'donations', label: 'My donations', icon: '💝' },
        { id: 'profile', label: 'Profile', icon: '👤' }
      ]
    : [
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'feed', label: 'Feed', icon: '📰' },
        { id: 'alerts', label: 'Alerts', icon: '🔔' },
        { id: 'needs', label: 'Needs', icon: '📋' },
        { id: 'profile', label: 'Profile', icon: '👤' }
      ];

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', minHeight: '100vh', background: '#f9f5f7', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '16px 20px 14px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#D4537E' }}>Care Connect</div>
          <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Community feed</div>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ height: '36px', padding: '0 14px', borderRadius: '8px', background: '#D4537E', border: 'none', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Post
        </button>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

        {/* Create post prompt */}
        <div onClick={() => setShowCreate(true)}
          style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '14px', border: '0.5px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
            {user?.name?.[0] || '?'}
          </div>
          <div style={{ flex: 1, height: '38px', borderRadius: '999px', background: '#f8f8f8', border: '0.5px solid #e0e0e0', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
            <span style={{ fontSize: '13px', color: '#9e9e9e' }}>Share an update about your home...</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner size={32} /></div>
        ) : posts.length === 0 ? (
          <EmptyState icon="📰" title="No posts yet" subtitle="Be the first to share an update!" />
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={user?._id}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #f0f0f0', display: 'flex', padding: '10px 0 16px', flexShrink: 0 }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => handleNav(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '9px', color: activeNav === item.id ? '#D4537E' : '#9e9e9e', fontWeight: activeNav === item.id ? '600' : '400', textAlign: 'center', lineHeight: '1.2' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreatePostModal
          homeId={user?.home_id}
          onClose={() => setShowCreate(false)}
          onPost={handleNewPost}
        />
      )}
    </div>
  );
}
