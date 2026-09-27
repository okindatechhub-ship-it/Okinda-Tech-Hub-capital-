import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  MessageSquare,
  Search,
  Send,
  Image as ImageIcon,
  ArrowLeft,
  Check,
  CheckCheck,
  Phone,
  DoorOpen,
  UserPlus,
  Upload,
  X,
  User as UserIcon,
  Circle
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { uploadLocalFile } from '../api/upload';
import { Conversation, Message } from '../types';

interface MessagesPageProps {
  initialRecipientId?: string | null;
  initialMessageText?: string;
  initialProductRef?: any;
  initialRoomRef?: any;
  onSelectProduct: (productId: string) => void;
  onSelectRoom: (roomId: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  initialRecipientId,
  initialMessageText,
  initialProductRef,
  initialRoomRef,
  onSelectProduct,
  onSelectRoom,
  openAuthModal,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // New Chat Modal (Registered users directory)
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        const convList = await apiRequest<Conversation[]>('/conversations');
        setConversations(convList || []);

        if (initialRecipientId && initialRecipientId !== user.id) {
          const res = await apiRequest<{ conversation: Conversation }>('/conversations', {
            method: 'POST',
            body: JSON.stringify({
              recipient_id: initialRecipientId,
              initial_message: initialMessageText || '',
              product_ref: initialProductRef || undefined,
              room_ref: initialRoomRef || undefined,
            }),
          });

          const refreshed = await apiRequest<Conversation[]>('/conversations');
          setConversations(refreshed || []);
          const found = refreshed.find(c => c.id === res.conversation?.id);
          if (found) {
            selectConversation(found);
          }
        } else if (convList && convList.length > 0) {
          selectConversation(convList[0]);
        }
      } catch {
        toast.error('Failed to load private messages');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user, initialRecipientId]);

  // Enhanced live message delivery & automatic read receipt polling
  useEffect(() => {
    if (!user || !activeConversation) return;

    const pollMessages = async () => {
      try {
        const msgList = await apiRequest<Message[]>(`/conversations/${activeConversation.id}/messages`);
        if (Array.isArray(msgList)) {
          const hasUnreadFromOther = msgList.some(m => m.sender_id !== user.id && !m.read_at);
          if (hasUnreadFromOther) {
            apiRequest(`/conversations/${activeConversation.id}/read`, { method: 'POST' }).catch(() => {});
          }
          setMessages(prev => {
            if (msgList.length !== prev.length || JSON.stringify(msgList) !== JSON.stringify(prev)) {
              return msgList;
            }
            return prev;
          });
        }
      } catch {
        // silent polling error
      }
    };

    const interval = setInterval(pollMessages, 2500);
    return () => clearInterval(interval);
  }, [user, activeConversation]);

  const selectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    try {
      // Mark as read immediately on viewing
      await apiRequest(`/conversations/${conv.id}/read`, { method: 'POST' });
      const msgList = await apiRequest<Message[]>(`/conversations/${conv.id}/messages`);
      setMessages(msgList || []);
      // Reset unread counter for this conversation locally
      setConversations(prev =>
        prev.map(c => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
      scrollToBottom();
    } catch {
      // ignore
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (attachmentUrl?: string) => {
    if ((!messageText.trim() && !attachmentUrl) || !activeConversation) return;

    const tempText = messageText;
    setMessageText('');

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: activeConversation.id,
      sender_id: user!.id,
      receiver_id: activeConversation.other_user.id,
      message_type: attachmentUrl ? 'image' : 'text',
      content: tempText,
      attachment_url: attachmentUrl,
      read_at: null,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      setSending(true);
      const serverMsg = await apiRequest<Message>(`/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: tempText,
          message_type: attachmentUrl ? 'image' : 'text',
          attachment_url: attachmentUrl
        }),
      });

      setMessages(prev => prev.map(m => (m.id === tempId ? serverMsg : m)));

      // Update conversations list snippet
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConversation.id
            ? {
                ...c,
                last_message: {
                  content: tempText || 'Sent an attachment',
                  sender_id: user!.id,
                  created_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
              }
            : c
        )
      );
    } catch (err: any) {
      toast.error('Failed to deliver message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageText(tempText);
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await uploadLocalFile(file);
      await handleSendMessage(url);
      toast.success('Image sent!');
    } catch {
      toast.error('Failed to attach image from device');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenNewChat = async () => {
    setIsNewChatModalOpen(true);
    try {
      setLoadingUsers(true);
      const list = await apiRequest<any[]>('/users/registered');
      setRegisteredUsers(list || []);
    } catch {
      toast.error('Failed to load registered users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleStartChatWith = async (targetUser: any) => {
    try {
      const res = await apiRequest<{ conversation: Conversation }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: targetUser.id,
          initial_message: `Hello ${targetUser.full_name}!`,
        }),
      });

      const refreshed = await apiRequest<Conversation[]>('/conversations');
      setConversations(refreshed || []);
      const found = refreshed.find(c => c.id === res.conversation?.id);
      if (found) {
        selectConversation(found);
      }
      setIsNewChatModalOpen(false);
    } catch {
      toast.error('Failed to start chat');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-[#E4E7EC] shadow-sm space-y-4">
        <MessageSquare className="w-12 h-12 text-[#D9A441] mx-auto" />
        <h2 className="text-xl font-bold text-[#102A43]">Sign in to access Private Messages</h2>
        <p className="text-xs text-[#667085]">
          Only registered residence members and administrators can chat privately.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold shadow-md hover:bg-[#1b3d5e] transition"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const filteredConversations = conversations.filter(c =>
    c.other_user?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-3xl border border-[#E4E7EC] shadow-sm flex flex-col md:flex-row h-[780px] overflow-hidden">
        {/* Left Pane: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-[#E4E7EC] flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-[#E4E7EC] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#102A43]">Messages</h2>
              <button
                onClick={handleOpenNewChat}
                className="px-3 py-1.5 bg-[#102A43] text-[#D9A441] hover:bg-[#1b3d5e] rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                title="Start chat with registered user"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New Chat</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered members..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E4E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] bg-[#F7F8FA] text-[#172B4D]"
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E4E7EC]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[#667085] space-y-3">
                <MessageSquare className="w-10 h-10 mx-auto text-[#D9A441]" />
                <p className="text-xs font-bold text-[#102A43]">No conversations yet</p>
                <p className="text-[11px] text-[#667085]">
                  Tap <strong>+ New Chat</strong> to privately message any registered resident or seller.
                </p>
                <button
                  onClick={handleOpenNewChat}
                  className="px-4 py-2 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold"
                >
                  Start a Conversation
                </button>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = activeConversation?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition ${
                      isSelected ? 'bg-[#fef8eb] border-r-4 border-[#D9A441]' : 'hover:bg-[#F1F3F5]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.other_user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.other_user?.name || 'User'}`}
                        alt={conv.other_user?.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover bg-slate-100 ring-2 ring-[#E4E7EC]"
                      />
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#D9A441] text-[#102A43] font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#102A43] truncate">
                          {conv.other_user?.name}
                        </h4>
                        <span className="text-[10px] text-[#667085] shrink-0">
                          {conv.last_message?.created_at
                            ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#667085] truncate mt-0.5">
                        {conv.last_message?.content || 'Started conversation'}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          conv.other_user?.role === 'admin'
                            ? 'bg-rose-100 text-rose-800'
                            : conv.other_user?.role === 'resident'
                            ? 'bg-[#102A43] text-[#D9A441]'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {conv.other_user?.role}
                        </span>
                        {conv.other_user?.room_number && (
                          <span className="text-[9px] text-[#667085]">
                            · {conv.other_user.room_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Room */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col bg-[#F7F8FA] relative">
            {/* Chat Header */}
            <div className="p-3.5 bg-white border-b border-[#E4E7EC] flex items-center justify-between shadow-xs z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1.5 rounded-lg text-[#667085] hover:bg-[#F1F3F5]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <img
                  src={activeConversation.other_user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${activeConversation.other_user?.name}`}
                  alt={activeConversation.other_user?.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover bg-slate-100 ring-2 ring-[#E4E7EC]"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-[#102A43]">
                      {activeConversation.other_user?.name}
                    </h3>
                    <span className="text-[9px] font-bold text-[#16A34A] flex items-center gap-0.5">
                      <Circle className="w-2 h-2 fill-[#16A34A] text-[#16A34A]" />
                      <span>Registered</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-[#667085]">
                    {activeConversation.other_user?.role} {activeConversation.other_user?.room_number ? `· ${activeConversation.other_user.room_number}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === user.id;

                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 space-y-2 text-xs shadow-xs ${
                        isMe
                          ? 'bg-[#102A43] text-white rounded-br-xs'
                          : 'bg-white text-[#172B4D] border border-[#E4E7EC] rounded-bl-xs'
                      }`}
                    >
                      {/* Attached Product Card */}
                      {msg.product_ref && (
                        <div
                          onClick={() => onSelectProduct(msg.product_ref!.id)}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                            isMe ? 'bg-[#1b3d5e] border-[#D9A441]/40 text-white' : 'bg-[#fef8eb] border-[#D9A441]/40 text-[#102A43]'
                          }`}
                        >
                          <img
                            src={msg.product_ref.image || '/src/assets/images/marketplace_item_setup_1790501145428.jpg'}
                            alt={msg.product_ref.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold uppercase text-[#D9A441]">Product Inquiry</span>
                            <h5 className="font-bold text-xs truncate">{msg.product_ref.name}</h5>
                            <p className="text-xs font-black text-[#D9A441]">KSh {msg.product_ref.price.toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {/* Attached Room Card */}
                      {msg.room_ref && (
                        <div
                          onClick={() => onSelectRoom(msg.room_ref!.id)}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                            isMe ? 'bg-[#1b3d5e] border-[#D9A441]/40 text-white' : 'bg-[#F7F8FA] border-[#E4E7EC] text-[#102A43]'
                          }`}
                        >
                          <DoorOpen className="w-8 h-8 text-[#D9A441] shrink-0" />
                          <div>
                            <span className="text-[9px] font-bold uppercase text-[#D9A441]">Room Inquiry</span>
                            <h5 className="font-bold text-xs">{msg.room_ref.room_number}</h5>
                            <p className="text-xs font-bold text-[#D9A441]">KSh {msg.room_ref.price.toLocaleString()} / sem</p>
                          </div>
                        </div>
                      )}

                      {/* Image Attachment from local storage */}
                      {msg.attachment_url && (
                        <img
                          src={msg.attachment_url}
                          alt="attached"
                          referrerPolicy="no-referrer"
                          className="w-full max-h-60 rounded-xl object-cover"
                        />
                      )}

                      {/* Text */}
                      {msg.content && <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>}

                      {/* Delivery Status & Read Receipts */}
                      <div className={`flex items-center justify-end gap-1 text-[9px] ${
                        isMe ? 'text-slate-300' : 'text-[#667085]'
                      }`}>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          msg.read_at ? (
                            <span title="Read by recipient" className="flex items-center text-[#D9A441]">
                              <CheckCheck className="w-3.5 h-3.5 text-[#D9A441]" />
                            </span>
                          ) : (
                            <span title="Delivered" className="flex items-center text-slate-400">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-[#E4E7EC] flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="p-2.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F1F3F5] text-[#102A43] transition shrink-0"
                title="Send photo from device storage"
              >
                <ImageIcon className="w-4 h-4 text-[#D9A441]" />
              </button>

              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 px-3.5 py-2.5 text-xs border border-[#E4E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441] bg-[#F7F8FA]"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={sending || !messageText.trim()}
                className="p-2.5 bg-[#102A43] hover:bg-[#1b3d5e] disabled:opacity-50 text-[#D9A441] rounded-xl transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center text-[#667085] space-y-3 bg-[#F7F8FA]">
            <div className="w-16 h-16 rounded-3xl bg-white border border-[#E4E7EC] flex items-center justify-center shadow-xs">
              <MessageSquare className="w-8 h-8 text-[#D9A441]" />
            </div>
            <h3 className="text-base font-bold text-[#102A43]">Select a Conversation</h3>
            <p className="text-xs max-w-sm">
              Chat privately with registered students, residents, and advertisers. Messages are delivered instantly with read receipts.
            </p>
            <button
              onClick={handleOpenNewChat}
              className="px-5 py-2.5 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold shadow-md hover:bg-[#1b3d5e] transition"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal: Select Registered User */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs" onClick={() => setIsNewChatModalOpen(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="absolute top-5 right-5 text-[#667085] hover:text-[#102A43]"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-[#102A43] mb-1">Registered Residence Members</h3>
              <p className="text-xs text-[#667085] mb-4">
                Select any registered resident or seller to start a private conversation.
              </p>

              {loadingUsers ? (
                <div className="p-8 text-center text-xs text-[#667085]">Loading members...</div>
              ) : registeredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#667085]">
                  No other registered users yet.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-[#E4E7EC]">
                  {registeredUsers.map(u => (
                    <div
                      key={u.id}
                      onClick={() => handleStartChatWith(u)}
                      className="p-3 flex items-center justify-between hover:bg-[#F7F8FA] rounded-xl cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`}
                          alt={u.full_name}
                          className="w-10 h-10 rounded-full object-cover bg-slate-100 ring-2 ring-[#E4E7EC]"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-[#102A43]">{u.full_name}</h4>
                          <p className="text-[10px] text-[#667085]">
                            {u.role} · Room: {u.room_number || 'Resident'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#102A43] px-3 py-1 bg-[#F1F3F5] rounded-lg">
                        Chat
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
