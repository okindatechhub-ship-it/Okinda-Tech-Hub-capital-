import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Image,
  Video,
  Send,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Download,
  Trash2,
  X,
  Upload,
  DoorOpen,
  Store,
  Play
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { uploadLocalFile } from '../api/upload';
import { Post, Comment, Product, Room } from '../types';

interface CommunityPageProps {
  openAuthModal: (mode: 'login' | 'register') => void;
  onSelectProduct: (productId: string) => void;
  onSelectRoom: (roomId: string) => void;
  onOpenChatWithUser?: (userId: string, initialMessage?: string) => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({
  openAuthModal,
  onSelectProduct,
  onSelectRoom,
  onOpenChatWithUser,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Create post state
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postVideoUrl, setPostVideoUrl] = useState<string>('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [showAttachmentPicker, setShowAttachmentPicker] = useState<'product' | 'room' | null>(null);

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Active comments accordion
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Saved posts
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFeed();
    loadAttachmentsData();
    if (user) {
      loadSavedPosts();
    }
  }, [user]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Post[]>('/posts');
      setPosts(data || []);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadAttachmentsData = async () => {
    try {
      const prodRes = await apiRequest('/products');
      setAvailableProducts(prodRes.products || []);
      const roomRes = await apiRequest('/rooms');
      setAvailableRooms(roomRes.rooms || []);
    } catch {
      // ignore
    }
  };

  const loadSavedPosts = async () => {
    try {
      const res = await apiRequest('/saved');
      if (res?.posts) {
        setSavedPostIds(res.posts.map((p: Post) => p.id));
      }
    } catch {
      // ignore
    }
  };

  // Upload image from local storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMedia(true);
      const url = await uploadLocalFile(file);
      setPostImages(prev => [...prev, url]);
      toast.success('Image loaded from device storage!');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingMedia(false);
    }
  };

  // Upload video from local storage
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMedia(true);
      const url = await uploadLocalFile(file);
      setPostVideoUrl(url);
      toast.success('Video loaded from device storage!');
    } catch {
      toast.error('Failed to upload video');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDownloadMedia = async (mediaUrl: string, defaultName = 'capital-home-media') => {
    try {
      toast.info('Starting media download to device storage...');
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = mediaUrl.includes('.mp4') ? '.mp4' : '.jpg';
      link.download = `${defaultName}-${Date.now()}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Downloaded to device storage successfully!');
    } catch {
      // Fallback
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = defaultName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Opening media to save...');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!postContent.trim() && !postImages.length && !postVideoUrl) {
      toast.error('Please add some text, an image, or a video');
      return;
    }

    try {
      setSubmittingPost(true);
      const res = await apiRequest<{ post: Post }>('/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: postContent,
          images: postImages,
          video_url: postVideoUrl || undefined,
          media_type: postVideoUrl ? 'video' : postImages.length ? 'image' : 'text',
          product_id: selectedProductId || undefined,
          room_id: selectedRoomId || undefined,
        }),
      });

      toast.success('Post published to public feed! Residents have been notified.');
      setPosts(prev => [res.post, ...prev]);
      setPostContent('');
      setPostImages([]);
      setPostVideoUrl('');
      setSelectedProductId('');
      setSelectedRoomId('');
      setShowAttachmentPicker(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await apiRequest<{ liked: boolean; likes_count: number }>(`/posts/${postId}/like`, {
        method: 'POST',
      });
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                has_liked: res.liked,
                likes_count: res.likes_count,
              }
            : p
        )
      );
    } catch {
      toast.error('Failed to like post');
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    if (!commentsByPost[postId]) {
      try {
        const comments = await apiRequest<Comment[]>(`/posts/${postId}/comments`);
        setCommentsByPost(prev => ({ ...prev, [postId]: comments || [] }));
      } catch {
        // ignore
      }
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!commentInput.trim()) return;

    try {
      setSubmittingComment(true);
      const newComment = await apiRequest<Comment>(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentInput.trim() }),
      });

      setCommentsByPost(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        )
      );
      setCommentInput('');
      toast.success('Comment posted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await apiRequest(`/posts/${postId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  const handleToggleSave = async (postId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await apiRequest('/saved/toggle', {
        method: 'POST',
        body: JSON.stringify({ item_type: 'post', item_id: postId }),
      });
      if (res.is_saved) {
        setSavedPostIds(prev => [...prev, postId]);
        toast.success('Post saved');
      } else {
        setSavedPostIds(prev => prev.filter(id => id !== postId));
        toast.info('Post removed from saved');
      }
    } catch {
      toast.error('Failed to toggle save');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#102A43] tracking-tight">
          Public Posts Feed
        </h1>
        <p className="text-xs text-[#667085] mt-1">
          Share images, videos & texts with Capital Home residents. Like, comment, share & download media.
        </p>
      </div>

      {/* Create Post Box */}
      <div className="bg-white rounded-3xl border border-[#E4E7EC] p-5 shadow-xs space-y-4">
        <div className="flex gap-3">
          <img
            src={user?.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${user ? user.full_name : 'Guest'}`}
            alt="avatar"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover bg-slate-100 ring-2 ring-[#E4E7EC] shrink-0"
          />
          <div className="flex-1 space-y-2">
            <textarea
              rows={3}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={user ? `What's on your mind at Capital Home, ${user.full_name.split(' ')[0]}?` : "Sign in to post text, photos, or videos..."}
              className="w-full text-xs sm:text-sm border-0 focus:ring-0 p-1 resize-none placeholder:text-slate-400 focus:outline-none text-[#172B4D]"
            />

            {/* Attached Media Previews */}
            {(postImages.length > 0 || postVideoUrl) && (
              <div className="space-y-2 pt-2 border-t border-[#E4E7EC]">
                {postImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {postImages.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E4E7EC]">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPostImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {postVideoUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-[#E4E7EC] max-h-48 bg-black">
                    <video src={postVideoUrl} controls className="w-full max-h-48" />
                    <button
                      type="button"
                      onClick={() => setPostVideoUrl('')}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Attached preview chips for Product or Room */}
            {(selectedProductId || selectedRoomId) && (
              <div className="space-y-2 pt-2 border-t border-[#E4E7EC]">
                {selectedProductId && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#fef8eb] border border-[#D9A441]/40 text-xs">
                    <span className="font-semibold text-[#102A43] truncate">
                      🛍️ Attached Product: {availableProducts.find(p => p.id === selectedProductId)?.name}
                    </span>
                    <button onClick={() => setSelectedProductId('')} className="text-[#667085] hover:text-[#102A43]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {selectedRoomId && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] text-xs">
                    <span className="font-semibold text-[#102A43] truncate">
                      🏠 Attached Room: {availableRooms.find(r => r.id === selectedRoomId)?.room_number}
                    </span>
                    <button onClick={() => setSelectedRoomId('')} className="text-[#667085] hover:text-[#102A43]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E4E7EC]">
          <div className="flex items-center gap-2">
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoUpload}
              accept="video/*"
              className="hidden"
            />

            {/* Upload Photo from Device Storage */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingMedia}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F1F3F5] text-xs font-bold text-[#102A43] transition"
            >
              <Image className="w-4 h-4 text-[#D9A441]" />
              <span>{uploadingMedia ? 'Uploading...' : 'Photo'}</span>
            </button>

            {/* Upload Video from Device Storage */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingMedia}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F1F3F5] text-xs font-bold text-[#102A43] transition"
            >
              <Video className="w-4 h-4 text-[#D9A441]" />
              <span>Video</span>
            </button>

            {/* Attach Product Deal */}
            <button
              type="button"
              onClick={() => setShowAttachmentPicker(showAttachmentPicker === 'product' ? null : 'product')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F1F3F5] text-xs font-semibold text-[#667085] transition"
            >
              <Store className="w-3.5 h-3.5 text-[#667085]" />
              <span>Product</span>
            </button>

            {/* Attach Room */}
            <button
              type="button"
              onClick={() => setShowAttachmentPicker(showAttachmentPicker === 'room' ? null : 'room')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F1F3F5] text-xs font-semibold text-[#667085] transition"
            >
              <DoorOpen className="w-3.5 h-3.5 text-[#667085]" />
              <span>Room</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreatePost}
            disabled={submittingPost || uploadingMedia}
            className="px-5 py-2 bg-[#102A43] hover:bg-[#1b3d5e] disabled:opacity-50 text-[#D9A441] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submittingPost ? 'Posting...' : 'Post to Feed'}</span>
          </button>
        </div>

        {/* Attachment Picker Drawers */}
        {showAttachmentPicker === 'product' && (
          <div className="p-3 bg-[#F7F8FA] rounded-2xl border border-[#E4E7EC] space-y-2 text-xs">
            <h4 className="font-bold text-[#102A43]">Select a product to attach:</h4>
            <div className="max-h-40 overflow-y-auto divide-y divide-[#E4E7EC]">
              {availableProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProductId(p.id); setShowAttachmentPicker(null); }}
                  className="p-2 flex items-center justify-between hover:bg-white rounded-lg cursor-pointer"
                >
                  <span className="font-semibold text-[#172B4D] truncate">{p.name}</span>
                  <span className="font-bold text-[#102A43] shrink-0 ml-2">KSh {p.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAttachmentPicker === 'room' && (
          <div className="p-3 bg-[#F7F8FA] rounded-2xl border border-[#E4E7EC] space-y-2 text-xs">
            <h4 className="font-bold text-[#102A43]">Select a room to attach:</h4>
            <div className="max-h-40 overflow-y-auto divide-y divide-[#E4E7EC]">
              {availableRooms.map(r => (
                <div
                  key={r.id}
                  onClick={() => { setSelectedRoomId(r.id); setShowAttachmentPicker(null); }}
                  className="p-2 flex items-center justify-between hover:bg-white rounded-lg cursor-pointer"
                >
                  <span className="font-semibold text-[#172B4D]">{r.room_number} ({r.room_type})</span>
                  <span className="text-[10px] text-[#667085]">{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feed Posts */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-60 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E4E7EC] p-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F3F5] text-[#102A43] flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-[#D9A441]" />
          </div>
          <h3 className="text-base font-bold text-[#102A43]">No posts yet</h3>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            Be the first resident to post photos, videos, updates, or room move-out notices!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map(post => {
            const isSaved = savedPostIds.includes(post.id);
            const isCommentsOpen = activeCommentsPostId === post.id;
            const comments = commentsByPost[post.id] || [];

            return (
              <div key={post.id} className="bg-white rounded-3xl border border-[#E4E7EC] shadow-xs p-5 space-y-4">
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.user_name}`}
                      alt={post.user_name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover bg-slate-100 ring-2 ring-[#E4E7EC]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#102A43]">{post.user_name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          post.user_role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : post.user_role === 'resident'
                            ? 'bg-[#102A43] text-[#D9A441]'
                            : 'bg-[#F1F3F5] text-[#172B4D]'
                        }`}>
                          {post.user_role}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#667085]">
                        {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleSave(post.id)}
                      className="p-1.5 rounded-lg text-[#667085] hover:text-[#102A43] transition"
                      title={isSaved ? 'Unsave' : 'Save'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'text-[#D9A441] fill-[#D9A441]' : ''}`} />
                    </button>

                    {(user?.id === post.user_id || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-[#667085] hover:text-red-600 transition"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Text */}
                {post.content && (
                  <p className="text-xs sm:text-sm text-[#172B4D] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                )}

                {/* Media: Image(s) with DOWNLOAD button */}
                {post.images && post.images.length > 0 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 rounded-2xl overflow-hidden bg-slate-100">
                      {post.images.map((img, idx) => (
                        <div key={idx} className="relative group overflow-hidden">
                          <img
                            src={img}
                            alt="post attachment"
                            referrerPolicy="no-referrer"
                            className="w-full max-h-[460px] object-cover rounded-2xl"
                          />
                          {/* DOWNLOAD BUTTON ON IMAGE */}
                          <button
                            type="button"
                            onClick={() => handleDownloadMedia(img, `capital-home-photo-${post.id}-${idx}.jpg`)}
                            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-[#102A43]/85 hover:bg-[#102A43] text-[#D9A441] text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-md transition"
                            title="Download image to device storage"
                          >
                            <Download className="w-3.5 h-3.5 text-[#D9A441]" />
                            <span>Download Photo</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media: Video with DOWNLOAD button */}
                {post.video_url && (
                  <div className="relative rounded-2xl overflow-hidden bg-black shadow-md">
                    <video
                      src={post.video_url}
                      controls
                      className="w-full max-h-[460px] rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => handleDownloadMedia(post.video_url!, `capital-home-video-${post.id}.mp4`)}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-[#102A43]/85 hover:bg-[#102A43] text-[#D9A441] text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-md transition"
                      title="Download video to device storage"
                    >
                      <Download className="w-3.5 h-3.5 text-[#D9A441]" />
                      <span>Download Video</span>
                    </button>
                  </div>
                )}

                {/* Attached Product Card */}
                {post.product_ref && (
                  <div
                    onClick={() => onSelectProduct(post.product_ref!.id)}
                    className="p-3 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 flex items-center justify-between cursor-pointer hover:bg-[#fdeece] transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={post.product_ref.image || '/src/assets/images/marketplace_item_setup_1790501145428.jpg'}
                        alt={post.product_ref.name}
                        className="w-12 h-12 rounded-xl object-cover bg-white shrink-0 border"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-[#D9A441] uppercase tracking-wider">Marketplace Deal</span>
                        <h5 className="font-bold text-xs text-[#102A43] line-clamp-1">{post.product_ref.name}</h5>
                        <p className="text-xs font-extrabold text-[#102A43]">KSh {post.product_ref.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#102A43] px-3 py-1.5 bg-white rounded-xl shadow-xs">
                      View Deal →
                    </span>
                  </div>
                )}

                {/* Attached Room Card */}
                {post.room_ref && (
                  <div
                    onClick={() => onSelectRoom(post.room_ref!.id)}
                    className="p-3 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] flex items-center justify-between cursor-pointer hover:bg-[#E4E7EC] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#102A43] text-[#D9A441] flex items-center justify-center shrink-0 font-black text-sm">
                        <DoorOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#D9A441] uppercase tracking-wider">Residence Vacancy</span>
                        <h5 className="font-bold text-xs text-[#102A43]">{post.room_ref.room_number}</h5>
                        <p className="text-xs font-extrabold text-[#102A43]">KSh {post.room_ref.price.toLocaleString()} / sem</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#102A43] px-3 py-1.5 bg-white rounded-xl shadow-xs">
                      View Room →
                    </span>
                  </div>
                )}

                {/* Engagement footer: Like, Comment, Share */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E4E7EC] text-xs">
                  <div className="flex items-center gap-4">
                    {/* Like */}
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition ${
                        post.has_liked ? 'text-rose-600' : 'text-[#667085] hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.has_liked ? 'fill-rose-600' : ''}`} />
                      <span>{post.likes_count || 0}</span>
                    </button>

                    {/* Comment */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 font-bold text-[#667085] hover:text-[#102A43] transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count || 0}</span>
                    </button>
                  </div>

                  {/* Share button */}
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Capital Home Post',
                          text: post.content,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Post link copied to clipboard!');
                      }
                    }}
                    className="flex items-center gap-1 font-semibold text-[#667085] hover:text-[#102A43]"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Accordion */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-[#E4E7EC] space-y-3">
                    {/* Comments list */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-xs text-[#667085] italic py-2">No comments yet. Write the first comment!</p>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className="p-2.5 rounded-2xl bg-[#F7F8FA] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#102A43]">{c.user_name}</span>
                              <span className="text-[10px] text-[#667085]">
                                {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-[#172B4D]">{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Input */}
                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs focus:ring-2 focus:ring-[#D9A441] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment}
                        className="px-4 py-2 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold hover:bg-[#1b3d5e] transition"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
