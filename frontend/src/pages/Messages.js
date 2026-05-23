import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
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
import { toast } from 'sonner';
import { 
  Send, 
  ArrowLeft, 
  MessageCircle, 
  Loader2,
  Image as ImageIcon,
  Check,
  CheckCheck,
  AlertTriangle,
  X,
  Shield,
  Flag,
  MoreVertical
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
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  
  // Report chat modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessageId, setReportMessageId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Create conversation from query params (from product detail page)
  useEffect(() => {
    const listingId = searchParams.get('listing');
    const sellerId = searchParams.get('seller');
    
    if (listingId && sellerId && user) {
      createConversation(listingId, sellerId);
    }
  }, [searchParams, user]);

  const createConversation = async (listingId, sellerId) => {
    try {
      const response = await api.post('/conversations', {
        listing_id: listingId,
        seller_id: sellerId
      });
      navigate(`/messages/${response.data.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      const conv = conversations.find(c => c.id === conversationId);
      setSelectedConversation(conv);
      fetchMessages(conversationId);
      connectWebSocket(conversationId);
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [conversationId, conversations, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = useCallback((convId) => {
    if (!token || !convId) return;
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/chat/${convId}?token=${token}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
          // Update conversation list
          setConversations(prev => prev.map(c => 
            c.id === convId 
              ? { ...c, last_message: data.message.text.slice(0, 50), last_message_at: data.message.created_at }
              : c
          ));
        } else if (data.type === 'typing') {
          setOtherUserTyping(data.is_typing);
        } else if (data.type === 'message_read') {
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id ? { ...msg, is_read: true } : msg
          ));
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [token]);

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

  const fetchMessages = async (convId) => {
    try {
      const response = await api.get(`/conversations/${convId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleTyping = () => {
    // Send typing status via REST (WebSocket will broadcast)
    if (selectedConversation) {
      api.post(`/conversations/${selectedConversation.id}/typing?is_typing=true`).catch(() => {});
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to clear typing status
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
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadRes.data.url}`;
      
      // Send message with image
      const response = await api.post('/messages', {
        conversation_id: selectedConversation.id,
        text: '📷 Image',
        attachment_url: imageUrl,
        attachment_type: 'image'
      });
      
      setMessages(prev => [...prev, response.data]);
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, last_message: '📷 Image', last_message_at: new Date().toISOString() }
          : c
      ));
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

    // Stop typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      api.post(`/conversations/${selectedConversation.id}/typing?is_typing=false`).catch(() => {});
    }

    setSending(true);
    try {
      const response = await api.post('/messages', {
        conversation_id: selectedConversation.id,
        text: newMessage
      });
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Update conversation in list
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, last_message: newMessage.slice(0, 50), last_message_at: new Date().toISOString() }
          : c
      ));
      
      // Show warning if message was flagged
      if (response.data.is_flagged) {
        toast.warning('Your message contained words that were filtered for safety');
      }
    } catch (error) {
      toast.error('Failed to send message');
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
      toast.success('Report submitted. We will review it shortly.');
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-4">
      <div className="max-w-6xl mx-auto px-4 h-[calc(100vh-8rem)]">
        <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-border">
              <h1 className="font-bold text-lg">Messages</h1>
            </div>
            
            {conversations.length > 0 ? (
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    to={`/messages/${conv.id}`}
                    className={`block p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-violet-600/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {conv.other_user_avatar ? (
                          <img src={conv.other_user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="font-bold text-violet-500">{conv.other_user_name?.[0] || 'U'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{conv.other_user_name}</p>
                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.listing_title}</p>
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{conv.last_message}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start chatting with sellers on listings
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => {
                      setSelectedConversation(null);
                      navigate('/messages');
                    }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Link to={`/listing/${selectedConversation.listing_id}`} className="flex items-center gap-3 flex-1">
                    {selectedConversation.listing_image && (
                      <img 
                        src={selectedConversation.listing_image} 
                        alt="" 
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedConversation.other_user_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedConversation.listing_title}</p>
                    </div>
                  </Link>
                  <p className="font-mono font-bold text-violet-500 mr-2">
                    ₹{selectedConversation.listing_price?.toLocaleString('en-IN')}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => openReportModal()}
                    title="Report this chat"
                  >
                    <Flag className="w-5 h-5" />
                  </Button>
                </div>

                {/* Safety Notice */}
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Be polite & respectful. Chats are monitored for safety. Never share personal info like passwords or bank details.
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender_id === user?.id;
                    const showDate = index === 0 || 
                      formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);
                    
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="text-center text-xs text-muted-foreground my-4">
                            {formatDate(msg.created_at)}
                          </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {!isOwn && (
                            <div className="w-8 h-8 rounded-full bg-violet-600/10 flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
                              {msg.sender_avatar ? (
                                <img src={msg.sender_avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-violet-500">{msg.sender_name?.[0]}</span>
                              )}
                            </div>
                          )}
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn 
                              ? 'bg-violet-600 text-white rounded-br-md' 
                              : 'bg-muted rounded-bl-md'
                          } ${msg.is_flagged ? 'border border-amber-500/50' : ''}`}>
                            {msg.attachment_url && msg.attachment_type === 'image' && (
                              <img 
                                src={msg.attachment_url} 
                                alt="" 
                                className="rounded-lg mb-2 max-w-full cursor-pointer"
                                onClick={() => window.open(msg.attachment_url, '_blank')}
                              />
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                              <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                                {formatTime(msg.created_at)}
                              </span>
                              {isOwn && (
                                msg.is_read ? (
                                  <CheckCheck className="w-3 h-3 text-cyan-300" />
                                ) : (
                                  <Check className="w-3 h-3 text-white/70" />
                                )
                              )}
                              {msg.is_flagged && (
                                <AlertTriangle className="w-3 h-3 text-amber-500" title="Message was filtered" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing indicator */}
                  {otherUserTyping && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-600/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-violet-500">
                          {selectedConversation.other_user_name?.[0]}
                        </span>
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-border">
                  <div className="flex gap-2">
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
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                    >
                      {imageUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </Button>
                    <Input
                      type="text"
                      placeholder="Type a polite message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      className="flex-1"
                      data-testid="message-input"
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || sending}
                      className="bg-violet-600 hover:bg-violet-700"
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
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Chat Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Chat</DialogTitle>
            <DialogDescription>
              {reportMessageId 
                ? "Report this specific message" 
                : "Report this conversation for inappropriate behavior"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for reporting *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam / Advertising</SelectItem>
                  <SelectItem value="harassment">Harassment / Abusive behavior</SelectItem>
                  <SelectItem value="scam">Scam attempt</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <Textarea
                placeholder="Provide more details about the issue..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReportModal(false);
              setReportMessageId(null);
              setReportReason('');
              setReportDetails('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleReportChat}
              disabled={reportLoading || !reportReason}
              className="bg-red-500 hover:bg-red-600"
            >
              {reportLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
