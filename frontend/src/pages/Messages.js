import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { FIELD_LIMITS } from '../lib/fieldLimits';
import {
  Send, 
  ArrowLeft, 
  MessageCircle, 
  Loader2,
  Image as ImageIcon,
  Check,
  CheckCheck,
  AlertTriangle,
  Shield,
  Flag,
  Store,
  Clock,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  Share2
} from 'lucide-react';

export default function Messages() {
  const { id: conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  
  // Report chat modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessageId, setReportMessageId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Delete chat modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Conversation limits (message + attachment counters)
  const [convLimits, setConvLimits] = useState(null);

  // Contact sharing state
  const [contactSharingStatus, setContactSharingStatus] = useState('NOT_SHARED');
  const [sharedContact, setSharedContact] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  // 1. Handle creating conversation from query params (?listing=X&seller=Y)
  useEffect(() => {
    const listingId = searchParams.get('listing');
    const sellerId = searchParams.get('seller');
    
    if (listingId && sellerId && user) {
      if (user.id === sellerId) {
        toast.info('This is your own listing.');
        navigate(`/listing/${listingId}`, { replace: true });
        return;
      }
      createOrOpenConversation(listingId, sellerId);
    }
  }, [searchParams, user]);

  const createOrOpenConversation = async (listingId, sellerId) => {
    try {
      const response = await api.post('/conversations', {
        listing_id: listingId,
        seller_id: sellerId
      });
      navigate(`/messages/${response.data.id}`, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to open conversation');
    }
  };

  // 2. Fetch all user conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Active Conversation selection & messages
  useEffect(() => {
    if (!conversationId) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    const loadActiveChat = async () => {
      // Find in existing list or fetch directly
      const cached = conversations.find(c => c.id === conversationId);
      if (cached) {
        setSelectedConversation(cached);
      } else {
        try {
          const res = await api.get(`/conversations/${conversationId}`);
          setSelectedConversation(res.data);
        } catch (err) {
          toast.error('Conversation not found or unauthorized');
          navigate('/messages', { replace: true });
          return;
        }
      }

      // Fetch messages
      fetchMessages(conversationId);
      // Connect WebSocket
      connectWebSocket(conversationId);
    };

    loadActiveChat();
    // Also fetch limits and contact sharing status
    if (conversationId) {
      fetchLimits(conversationId);
      fetchSharedContact(conversationId);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [conversationId, token]);

  const fetchMessages = async (convId) => {
    try {
      const response = await api.get(`/conversations/${convId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchLimits = async (convId) => {
    try {
      const response = await api.get(`/conversations/${convId}/limits`);
      setConvLimits(response.data);
      setContactSharingStatus(response.data.contact_sharing_status || 'NOT_SHARED');
    } catch (error) {
      console.error('Failed to fetch conversation limits:', error);
    }
  };

  const fetchSharedContact = async (convId) => {
    try {
      const response = await api.get(`/conversations/${convId}/contact`);
      if (response.data.contact_sharing_status === 'SHARED') {
        setSharedContact(response.data.contact);
        setContactSharingStatus('SHARED');
      } else {
        setSharedContact(null);
        setContactSharingStatus('NOT_SHARED');
      }
    } catch (error) {
      console.error('Failed to fetch shared contact:', error);
    }
  };

  const connectWebSocket = useCallback((convId) => {
    if (!token || !convId) return;
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/chat/${convId}?token=${token}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_message') {
            setMessages(prev => [...prev, data.message]);
            setConversations(prev => prev.map(c => 
              c.id === convId 
                ? { ...c, last_message: (data.message.text || 'Attachment').slice(0, 50), last_message_at: data.message.created_at }
                : c
            ));
            // Update limits from the response if provided
            if (data.message.message_limit) {
              setConvLimits(prev => ({
                ...(prev || {}),
                message_count: data.message.conversation_message_count ?? ((prev?.message_count || 0) + 1),
                attachment_count: data.message.attachment_url
                  ? data.message.conversation_attachment_count ?? ((prev?.attachment_count || 0) + 1)
                  : (prev?.attachment_count || 0),
                message_limit: data.message.message_limit || 100,
                attachment_limit: data.message.attachment_limit || 5
              }));
            }
          } else if (data.type === 'typing') {
            setOtherUserTyping(data.is_typing);
          } else if (data.type === 'message_read') {
            setMessages(prev => prev.map(msg => 
              msg.id === data.message_id ? { ...msg, is_read: true } : msg
            ));
          } else if (data.type === 'contact_shared') {
            setContactSharingStatus('SHARED');
            setSharedContact(data.contact);
            if (user && selectedConversation && user.id !== selectedConversation.seller_id) {
              toast.success('The seller has shared their contact details with you!');
            }
          } else if (data.type === 'contact_revoked') {
            setContactSharingStatus('NOT_SHARED');
            setSharedContact(null);
          }
        } catch (err) {
          // ignore parsing error
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleTyping = () => {
    if (selectedConversation) {
      api.post(`/conversations/${selectedConversation.id}/typing?is_typing=true`).catch(() => {});
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        api.post(`/conversations/${selectedConversation.id}/typing?is_typing=false`).catch(() => {});
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'message');
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`;
      
      const response = await api.post('/messages', {
        conversation_id: selectedConversation.id,
        text: '📷 Image Attachment',
        attachment_url: imageUrl,
        attachment_type: 'image'
      });
      
      setMessages(prev => [...prev, response.data]);
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, last_message: '📷 Image Attachment', last_message_at: new Date().toISOString() }
          : c
      ));
      // Update attachment count
      setConvLimits(prev => ({
        ...(prev || {}),
        message_count: response.data.conversation_message_count ?? ((prev?.message_count || 0) + 1),
        attachment_count: response.data.conversation_attachment_count ?? ((prev?.attachment_count || 0) + 1),
        message_limit: response.data.message_limit || 100,
        attachment_limit: response.data.attachment_limit || 5
      }));
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      api.post(`/conversations/${selectedConversation.id}/typing?is_typing=false`).catch(() => {});
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await api.post('/messages', {
        conversation_id: selectedConversation.id,
        text: messageText
      });
      setMessages(prev => [...prev, response.data]);
      
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, last_message: messageText.slice(0, 50), last_message_at: new Date().toISOString() }
          : c
      ));
      
      if (response.data.is_flagged) {
        toast.warning('Your message contained filtered keywords for user safety.');
      }
      // Update local limits counters
      setConvLimits(prev => ({
        ...(prev || {}),
        message_count: response.data.conversation_message_count ?? ((prev?.message_count || 0) + 1),
        attachment_count: prev?.attachment_count || 0,
        message_limit: response.data.message_limit || 100,
        attachment_limit: response.data.attachment_limit || 5
      }));
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleReportChat = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    
    setReportLoading(true);
    try {
      await api.post('/chat-reports', {
        conversation_id: selectedConversation.id,
        message_id: reportMessageId || null,
        reason: reportReason,
        details: reportDetails
      });
      toast.success('Report submitted. Our moderation team will review this conversation.');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
      setReportMessageId(null);
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setReportLoading(false);
    }
  };

  const openReportModal = (messageId = null) => {
    setReportMessageId(messageId);
    setShowReportModal(true);
  };

  const handleDeleteConversation = () => {
    if (!selectedConversation) return;
    setShowDeleteModal(true);
  };

  const isSeller = selectedConversation && user && selectedConversation.seller_id === user.id;

  const handleShareContact = async () => {
    if (!selectedConversation || !isSeller || contactLoading) return;
    setContactLoading(true);
    try {
      const response = await api.post(`/conversations/${selectedConversation.id}/contact/share`);
      setContactSharingStatus('SHARED');
      setSharedContact(response.data.contact);
      toast.success('Your contact details have been shared with the buyer.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to share contact');
    } finally {
      setContactLoading(false);
    }
  };

  const handleRevokeContact = async () => {
    if (!selectedConversation || !isSeller || contactLoading) return;
    setContactLoading(true);
    try {
      await api.post(`/conversations/${selectedConversation.id}/contact/revoke`);
      setContactSharingStatus('NOT_SHARED');
      setSharedContact(null);
      toast.success('Contact details have been revoked.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to revoke contact');
    } finally {
      setContactLoading(false);
    }
  };

  const confirmDeleteConversation = async () => {
    if (!selectedConversation || deleteLoading) return;
    
    setDeleteLoading(true);
    try {
      await api.delete(`/conversations/${selectedConversation.id}`);
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
      setSelectedConversation(null);
      setMessages([]);
      setShowDeleteModal(false);
      navigate('/messages', { replace: true });
      toast.success('Conversation removed from your inbox');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete conversation');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isClosed = selectedConversation?.status === 'closed_sold' || selectedConversation?.status === 'closed_expired';
  const msgLimitReached = convLimits && convLimits.message_count >= convLimits.message_limit;
  const attachLimitReached = convLimits && convLimits.attachment_count >= convLimits.attachment_limit;
  const msgLimitWarning = convLimits && !msgLimitReached && convLimits.message_count >= convLimits.message_limit - 10;

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8" data-testid="messages-page">
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-8rem)] min-h-[500px]">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Conversations Sidebar */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-violet-500" />
                Messages
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
              </span>
            </div>
            
            {conversations.length > 0 ? (
              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    to={`/messages/${conv.id}`}
                    className={`block p-3.5 hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-violet-500/10 dark:bg-violet-500/15' : ''
                    }`}
                  >
                    <div className="flex gap-3 items-center">
                      <Avatar
                        src={conv.other_user_avatar}
                        name={conv.other_user_name}
                        size="lg"
                        className="w-11 h-11 border border-violet-500/20"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-bold text-sm truncate text-foreground">{conv.other_user_name}</p>
                          <div className="flex items-center gap-1">
                            {conv.status === 'closed_sold' && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 border-cyan-500/40 text-cyan-500">SOLD</Badge>
                            )}
                            {conv.status === 'closed_expired' && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">EXPIRED</Badge>
                            )}
                            {conv.unread_count > 0 && (
                              <span className="h-4 min-w-[16px] px-1 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-medium">{conv.listing_title}</p>
                        {conv.last_message && (
                          <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{conv.last_message}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="font-bold text-foreground text-sm">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                    Click 'Chat with Seller' on any product page to start a deal.
                  </p>
                  <Link to="/marketplace" className="inline-block mt-4">
                    <Button size="sm" variant="outline" className="text-xs">Browse Marketplace</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Chat Area */}
          <div className={`flex-1 flex flex-col bg-card/60 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 sm:p-4 border-b border-border flex items-center gap-3 bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => {
                      setSelectedConversation(null);
                      navigate('/messages');
                    }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>

                  <Link to={`/listing/${selectedConversation.listing_id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                    {selectedConversation.listing_image && (
                      <img 
                        src={selectedConversation.listing_image} 
                        alt="" 
                        className="w-10 h-10 rounded-xl object-cover border border-border shrink-0 group-hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm truncate text-foreground group-hover:text-violet-500 transition-colors">
                          {selectedConversation.other_user_name}
                        </p>
                        {selectedConversation.status === 'closed_sold' && (
                          <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-[10px] px-1.5 py-0">
                            LISTING SOLD
                          </Badge>
                        )}
                        {selectedConversation.status === 'closed_expired' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                            EXPIRED (60D)
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{selectedConversation.listing_title}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-mono font-bold text-sm sm:text-base text-violet-500">
                      ₹{selectedConversation.listing_price?.toLocaleString('en-IN')}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => openReportModal()}
                      title="Report this conversation"
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDeleteConversation}
                      title="Delete conversation from inbox"
                      data-testid="delete-conversation-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Safety Notice Banner */}
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Meet in safe public spots in Kerala. Inspect hardware before payment. Never share OTPs.</span>
                </div>

                {/* Shared Contact Card (shown to buyer when seller has shared contact) */}
                {contactSharingStatus === 'SHARED' && sharedContact && (
                  <div className="px-4 py-2.5 border-b border-border bg-emerald-500/5">
                    <div className="flex items-start gap-3">
                      <UserCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                          {isSeller ? 'You have shared your contact with this buyer' : 'Seller has shared their contact with you'}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {sharedContact.phone && (
                            <a href={`tel:${sharedContact.phone}`} className="flex items-center gap-1.5 text-xs text-foreground hover:text-emerald-600 transition-colors">
                              <Phone className="w-3 h-3" />
                              <span className="font-mono">{sharedContact.phone}</span>
                            </a>
                          )}
                          {sharedContact.email && (
                            <a href={`mailto:${sharedContact.email}`} className="flex items-center gap-1.5 text-xs text-foreground hover:text-emerald-600 transition-colors">
                              <Mail className="w-3 h-3" />
                              <span>{sharedContact.email}</span>
                            </a>
                          )}
                          {!sharedContact.phone && !sharedContact.email && (
                            <span className="text-xs text-muted-foreground">No contact details on profile.</span>
                          )}
                        </div>
                      </div>
                      {isSeller && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] h-7 px-2 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={handleRevokeContact}
                          disabled={contactLoading}
                        >
                          {contactLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Revoke'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Seller Share Contact Prompt (only shown to seller when not yet shared, conversation is open) */}
                {isSeller && contactSharingStatus === 'NOT_SHARED' && !isClosed && (
                  <div className="px-4 py-2 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        <Share2 className="w-3 h-3 inline mr-1" />
                        Share your contact details (phone/email) with this buyer?
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-7 px-2.5 shrink-0 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                        onClick={handleShareContact}
                        disabled={contactLoading}
                      >
                        {contactLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                        Share
                      </Button>
                    </div>
                  </div>
                )}

                {/* Messages Container */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender_id === user?.id;
                    const showDate = index === 0 || 
                      formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);
                    
                    return (
                      <div key={msg.id || index}>
                        {showDate && (
                          <div className="text-center text-[11px] font-semibold text-muted-foreground my-3 uppercase tracking-wider">
                            {formatDate(msg.created_at)}
                          </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {!isOwn && (
                            <Avatar
                              src={msg.sender_avatar}
                              name={msg.sender_name}
                              size="sm"
                              className="w-7 h-7 mr-2 border border-violet-500/20"
                            />
                          )}
                          <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                            isOwn 
                              ? 'bg-violet-600 text-white rounded-br-sm' 
                              : 'bg-muted rounded-bl-sm text-foreground'
                          } ${msg.is_flagged ? 'border border-amber-500/50' : ''}`}>
                            {msg.attachment_url && (
                              <img 
                                src={msg.attachment_url} 
                                alt="" 
                                className="rounded-xl mb-2 max-w-full max-h-60 object-cover cursor-pointer hover:opacity-95"
                                onClick={() => window.open(msg.attachment_url, '_blank')}
                              />
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 text-[10px] ${isOwn ? 'justify-end text-white/75' : 'text-muted-foreground'}`}>
                              <span>{formatTime(msg.created_at)}</span>
                              {isOwn && (
                                msg.is_read ? (
                                  <CheckCheck className="w-3 h-3 text-cyan-300" />
                                ) : (
                                  <Check className="w-3 h-3 text-white/70" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {otherUserTyping && (
                    <div className="flex items-center gap-2">
                      <div className="bg-muted rounded-xl px-3 py-1.5 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Footer or Closed Banner */}
                {isClosed ? (
                  <div className="p-4 border-t border-border bg-muted/40 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {selectedConversation.status === 'closed_sold'
                          ? 'This conversation is closed because the listing has been marked as sold.'
                          : 'This conversation is closed because it has expired after 60 days.'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Full conversation history is preserved for review. New messages cannot be sent.
                    </p>
                  </div>
                ) : msgLimitReached ? (
                  <div className="p-4 border-t border-border bg-muted/40 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Message limit reached ({convLimits.message_limit} messages). This conversation has ended.</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Marketplace conversations are limited to {convLimits.message_limit} messages to keep negotiations focused.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Limit progress bar (only shown when approaching limits) */}
                    {convLimits && (msgLimitWarning || (convLimits.attachment_count >= convLimits.attachment_limit - 1 && convLimits.attachment_limit > 0)) && (
                      <div className="px-4 py-1.5 border-t border-border bg-muted/30 flex items-center gap-3 text-[11px] text-muted-foreground">
                        {msgLimitWarning && (
                          <span className="text-amber-500 font-semibold">
                            {convLimits.message_limit - convLimits.message_count} messages remaining
                          </span>
                        )}
                        {convLimits.attachment_count >= convLimits.attachment_limit - 1 && convLimits.attachment_limit > 0 && (
                          <span className={`font-semibold ${attachLimitReached ? 'text-red-500' : 'text-amber-500'}`}>
                            {attachLimitReached ? 'Image limit reached' : `${convLimits.attachment_limit - convLimits.attachment_count} image(s) left`}
                          </span>
                        )}
                      </div>
                    )}
                    <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-border bg-card">
                      <div className="flex gap-2 items-center">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl shrink-0"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageUploading || attachLimitReached}
                          title={attachLimitReached ? `Image limit reached (${convLimits?.attachment_limit} max)` : 'Attach Image'}
                        >
                          {imageUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className={`w-4 h-4 ${attachLimitReached ? 'text-muted-foreground/40' : 'text-muted-foreground'}`} />
                          )}
                        </Button>

                        <Input
                          type="text"
                          placeholder="Type a polite message..."
                          value={newMessage}
                          maxLength={FIELD_LIMITS.CHAT_MESSAGE}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          className="flex-1 h-10 rounded-xl"
                          data-testid="message-input"
                        />

                        <Button 
                          type="submit" 
                          disabled={!newMessage.trim() || sending}
                          className="bg-violet-600 hover:bg-violet-700 h-10 px-4 rounded-xl shrink-0"
                          data-testid="send-message-btn"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    Choose a chat from the sidebar or click 'Chat with Seller' on any product page.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Chat Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report Conversation</DialogTitle>
            <DialogDescription>
              Report this chat to the moderation team for inspection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scam">Scam / Advance payment request</SelectItem>
                  <SelectItem value="fake_deal">Fake deal / Misleading pricing</SelectItem>
                  <SelectItem value="harassment">Harassment / Abusive language</SelectItem>
                  <SelectItem value="spam">Spam / Advertising</SelectItem>
                  <SelectItem value="other">Other issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Additional details (optional)</Label>
                <span className={`text-xs ${reportDetails.length >= FIELD_LIMITS.REPORT_DETAILS ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                  {reportDetails.length} / {FIELD_LIMITS.REPORT_DETAILS}
                </span>
              </div>
              <Textarea
                placeholder="Describe what occurred..."
                value={reportDetails}
                maxLength={FIELD_LIMITS.REPORT_DETAILS}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReportChat}
              disabled={reportLoading || !reportReason}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              {reportLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Conversation Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Conversation
            </DialogTitle>
            <DialogDescription className="text-left pt-2 text-foreground/80">
              Are you sure you want to remove this chat with <strong className="text-foreground">{selectedConversation?.other_user_name}</strong> from your inbox?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-3 rounded-xl border border-border text-xs text-muted-foreground">
            Deleting this chat removes it from your personal conversation list. Retained history remains safely archived for safety and moderation.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteConversation}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              data-testid="confirm-delete-conversation-btn"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                'Delete Chat'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
