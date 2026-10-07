'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  SquarePen,
  ArrowLeft,
  Send,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Bot,
  MoreVertical,
  Phone,
  Video,
  CheckCheck,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Conversation, ChatMessage } from '@/types';
import { useToast } from '@/components/ui/Toast';
import {
  messagingService,
  CONVERSATIONS_UPDATED_EVENT,
  AUTO_REPLY_CHANGED_EVENT,
} from '@/lib/messagingService';
import { NewMessageModal } from './NewMessageModal';

interface FullMessagesPageProps {
  onBackToFeed?: () => void;
}

export const FullMessagesPage: React.FC<FullMessagesPageProps> = ({ onBackToFeed }) => {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    messagingService.getConversations()
  );
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('xentro_active_conversation_id');
      const all = messagingService.getConversations();
      if (saved && all.some((c) => c.id === saved)) return saved;
      return all[0]?.id || '';
    }
    return messagingService.getConversations()[0]?.id || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [replyText, setReplyText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAutoReply, setIsAutoReply] = useState(() => messagingService.isAutoReplyEnabled());
  const [isSending, setIsSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('thread');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  useEffect(() => {
    messagingService.syncFromServer().then((all) => {
      if (Array.isArray(all) && all.length > 0) {
        setConversations(all);
        const currentActive = messagingService.getActiveConversationId();
        const targetId = (currentActive && all.some(c => c.id === currentActive)) ? currentActive : all[0].id;
        setActiveConversationId(targetId);
        messagingService.fetchConversationMessages(targetId);
      }
    });

    const handleUpdated = () => {
      const all = messagingService.getConversations();
      setConversations(all);
      const activeId = typeof window !== 'undefined' ? localStorage.getItem('xentro_active_conversation_id') : null;
      if (activeId && all.some((c) => c.id === activeId)) {
        setActiveConversationId(activeId);
      }
    };
    const handleAutoReply = () => {
      setIsAutoReply(messagingService.isAutoReplyEnabled());
    };
    const handleNavigate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.conversationId) {
        setActiveConversationId(custom.detail.conversationId);
        messagingService.fetchConversationMessages(custom.detail.conversationId);
        setMobileView('thread');
      }
    };

    window.addEventListener(CONVERSATIONS_UPDATED_EVENT, handleUpdated);
    window.addEventListener(AUTO_REPLY_CHANGED_EVENT, handleAutoReply);
    window.addEventListener('xentro-navigate-tab', handleNavigate);

    return () => {
      window.removeEventListener(CONVERSATIONS_UPDATED_EVENT, handleUpdated);
      window.removeEventListener(AUTO_REPLY_CHANGED_EVENT, handleAutoReply);
      window.removeEventListener('xentro-navigate-tab', handleNavigate);
    };
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || (conversations.length > 0 ? conversations[0] : null);

  const filteredConversations = conversations.filter((c) => {
    const partnerName = c.user?.name || '';
    const lastMsg = c.lastMessage || '';
    const matchesSearch =
      partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMsg.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'unread') {
      return matchesSearch && c.unreadCount > 0;
    }
    return matchesSearch;
  });

  const totalUnread = conversations.reduce((acc, curr) => acc + curr.unreadCount, 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isTyping]);

  // Mark the active thread as read immediately on mount or when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.find((c) => c.id === activeConversationId);
      if (conv && conv.unreadCount > 0) {
        setConversations(messagingService.markRead(activeConversationId));
      }
    }
  }, [activeConversationId]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileView('thread');
    setConversations(messagingService.markRead(id));
    messagingService.fetchConversationMessages(id);
  };

  const handleToggleAutoReply = () => {
    const next = messagingService.toggleAutoReply();
    setIsAutoReply(next);
    showToast(
      next
        ? 'Auto-Reply ON: Assistant will reply to sent messages'
        : 'Auto-Reply OFF: Real 1-on-1 mode active (no bot replies)',
      next ? 'info' : 'success'
    );
  };

  const handleOpenPartnerProfile = () => {
    if (!activeConversation) return;
    const partner = activeConversation.user;
    const roleStr = (partner.role || '').toLowerCase();
    let pType: 'startup' | 'mentor' | 'investor' | 'esp' | 'explorer' = 'explorer';
    if (roleStr.includes('founder') || roleStr.includes('startup')) pType = 'startup';
    else if (roleStr.includes('mentor') || roleStr.includes('advisor')) pType = 'mentor';
    else if (roleStr.includes('investor') || roleStr.includes('vc') || roleStr.includes('angel')) pType = 'investor';
    else if (roleStr.includes('incubator') || roleStr.includes('accelerator') || roleStr.includes('esp')) pType = 'esp';

    window.dispatchEvent(
      new CustomEvent('xentro-open-profile', {
        detail: {
          type: pType,
          id: partner.id,
          data: {
            id: partner.id,
            name: partner.name,
            avatar: partner.avatar,
            role: partner.role,
            company: partner.company,
          },
        },
      })
    );
  };

  const handleRetryMessage = (messageId: string) => {
    if (!activeConversation) return;
    const updated = messagingService.retryMessage(activeConversation.id, messageId);
    setConversations(updated);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    const targetId = activeConversation.id;
    const text = replyText.trim();
    setReplyText('');

    const updated = messagingService.sendMessage(targetId, text);
    setConversations(updated);

    setTimeout(() => {
      setIsSending(false);
    }, 600);

    if (isAutoReply) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setConversations(messagingService.getConversations());
      }, 1500);
    }
  };

  return (
    <div className="w-full">
      {/* Top Breadcrumb / Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {onBackToFeed && (
            <button
              onClick={onBackToFeed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Feed
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#101212] dark:text-white tracking-tight font-display">
              Messaging
            </h1>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Connect, collaborate, and exchange opportunities in real time
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewMessageOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#D9FF3F] text-[#101212] rounded-xl text-xs font-bold hover:bg-[#C7F020] transition-colors shadow-sm"
        >
          <SquarePen className="w-4 h-4" />
          <span className="hidden sm:inline">New Message</span>
        </button>
      </div>

      {/* Main Full-Page Messaging Card */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-180px)] min-h-[560px]">
        {/* ========================================================================= */}
        {/* Left Column: Conversations List */}
        {/* ========================================================================= */}
        <div
          className={`w-full md:w-[340px] lg:w-[380px] border-r border-[#E5E7EB] dark:border-[#262A29] flex flex-col flex-shrink-0 bg-white dark:bg-[#181B1A] ${
            mobileView === 'thread' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Header */}
          <div className="p-3.5 border-b border-[#E5E7EB] dark:border-[#262A29] space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#565B59] dark:text-[#B6B8B7]" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F7F8F6] dark:bg-[#202422] border border-transparent focus:border-[#D9FF3F] focus:ring-1 focus:ring-[#D9FF3F]/30 rounded-xl text-xs text-[#101212] dark:text-white placeholder-[#B6B8B7] focus:outline-none transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-[#D9FF3F] text-[#101212]'
                    : 'text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-white'
                }`}
              >
                All Messages
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeFilter === 'unread'
                    ? 'bg-[#D9FF3F] text-[#101212]'
                    : 'text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-white'
                }`}
              >
                Unread
                {totalUnread > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#101212] text-[#D9FF3F]">
                    {totalUnread}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]/60 dark:divide-[#262A29]/60">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConversation?.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors relative ${
                      isSelected
                        ? 'bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/10'
                        : 'hover:bg-gray-50 dark:hover:bg-[#202422]/50'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#D9FF3F]" />
                    )}

                    {/* Avatar with Online indicator */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.user.avatar}
                        alt={conv.user.name}
                        className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                      {conv.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#181B1A]" />
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-[#101212] dark:text-white truncate">
                          {conv.user.name}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] flex-shrink-0">
                          {conv.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate mb-1">
                        {conv.user.role}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          conv.unreadCount > 0
                            ? 'font-bold text-[#101212] dark:text-white'
                            : 'text-[#565B59] dark:text-[#B6B8B7]'
                        }`}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <div className="w-4 h-4 rounded-full bg-[#D9FF3F] text-[#101212] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-1">
                        {conv.unreadCount}
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-48">
                <p className="text-xs font-bold text-[#101212] dark:text-white">
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </p>
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-1 max-w-[200px]">
                  {searchQuery
                    ? 'Try a different search query.'
                    : 'Connect with ecosystem members or compose a new direct message.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsNewMessageOpen(true)}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] transition-colors"
                  >
                    Compose
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Right Column: Active Thread View */}
        {/* ========================================================================= */}
        {activeConversation ? (
          <div
            className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#181B1A] ${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Thread Header */}
            <div className="h-16 px-4 sm:px-6 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile back button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 rounded-lg text-[#565B59] hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Partner Info - Click to inspect public profile */}
                <button
                  type="button"
                  onClick={handleOpenPartnerProfile}
                  className="flex items-center gap-3 min-w-0 text-left group hover:opacity-90 transition-opacity cursor-pointer"
                  title={`View ${activeConversation.user.name}'s public profile`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={activeConversation.user.avatar}
                      alt={activeConversation.user.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 group-hover:ring-2 group-hover:ring-[#D9FF3F] transition-all"
                    />
                    {activeConversation.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#181B1A]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#101212] dark:text-white truncate group-hover:text-[#9EBE12] dark:group-hover:text-[#D9FF3F] transition-colors">
                        {activeConversation.user.name}
                      </span>
                      {activeConversation.user.verified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center text-[8px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] truncate">
                      {activeConversation.user.role} ·{' '}
                      {isTyping ? (
                        <span className="text-[#9EBE12] font-semibold animate-pulse">
                          Typing...
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-medium">
                          {activeConversation.isOnline ? 'Active now' : 'Offline'}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Auto-Reply Mode Status & Toggle Pill */}
                <button
                  type="button"
                  onClick={handleToggleAutoReply}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isAutoReply
                      ? 'bg-[#D9FF3F]/20 text-[#D9FF3F] border-[#D9FF3F]/40 shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-[#565B59] dark:text-[#8E9290] border-gray-200 dark:border-white/10 hover:text-[#101212] dark:hover:text-white'
                  }`}
                  title={
                    isAutoReply
                      ? 'Auto-Reply is currently ON (Click to switch to Real 1-on-1 Mode)'
                      : 'Auto-Reply is currently OFF (Click to enable assistant Auto-Replies)'
                  }
                >
                  <Bot className={`w-3.5 h-3.5 ${isAutoReply ? 'text-[#D9FF3F]' : 'text-gray-400'}`} />
                  <span className="hidden sm:inline">Auto-Reply:</span>
                  <span>{isAutoReply ? 'ON' : 'OFF'}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAutoReply ? 'bg-[#D9FF3F] animate-pulse' : 'bg-gray-400'
                    }`}
                  />
                </button>

                <button
                  onClick={() => showToast('Direct voice calls are coming in Xentro 2.0 with WebRTC integration.', 'info')}
                  className="p-2 text-[#565B59] hover:text-[#101212] dark:hover:text-[#D9FF3F] hover:bg-[#F7F8F6] dark:hover:bg-[#202422] rounded-xl transition-colors active:scale-90 opacity-70 hover:opacity-100"
                  title="Voice Call (Coming in v2.0)"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => showToast('High-definition video calls are coming in Xentro 2.0 with WebRTC integration.', 'info')}
                  className="p-2 text-[#565B59] hover:text-[#101212] dark:hover:text-[#D9FF3F] hover:bg-[#F7F8F6] dark:hover:bg-[#202422] rounded-xl transition-colors active:scale-90 opacity-70 hover:opacity-100"
                  title="Video Call (Coming in v2.0)"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => showToast('Conversation options')}
                  className="p-2 text-[#565B59] hover:text-[#101212] dark:hover:text-[#D9FF3F] hover:bg-[#F7F8F6] dark:hover:bg-[#202422] rounded-xl transition-colors active:scale-90"
                  title="More Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F7F8F6] dark:bg-[#0D0F0F]">
              <div className="text-center my-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-200/60 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                  Today
                </span>
              </div>

              {activeConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.isMe ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!msg.isMe && (
                    <img
                      src={activeConversation.user.avatar}
                      alt={activeConversation.user.name}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
                    />
                  )}

                  <div className="max-w-[80%] sm:max-w-[70%]">
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        msg.isMe
                          ? 'bg-[#D9FF3F] text-[#101212] font-medium rounded-br-sm'
                          : 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white border border-[#E5E7EB] dark:border-[#262A29] rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-1 text-[10px] ${
                        msg.isMe ? 'justify-end' : 'justify-start'
                      } ${msg.failed ? 'text-rose-500' : 'text-[#94A3B8]'}`}
                    >
                      {msg.failed ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-rose-500">Failed to send</span>
                          <button
                            type="button"
                            onClick={() => handleRetryMessage(msg.id)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold hover:bg-rose-500/20 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            Retry
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{msg.timestamp}</span>
                          {msg.isMe && <CheckCheck className="w-3 h-3 text-[#9EBE12]" />}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator bubble */}
              {isTyping && (
                <div className="flex items-end gap-2 justify-start animate-fade-slide">
                  <img
                    src={activeConversation.user.avatar}
                    alt={activeConversation.user.name}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
                  />
                  <div className="bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl rounded-bl-sm p-3.5 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D9FF3F] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-[#D9FF3F] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[#D9FF3F] animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <div className="p-3 sm:p-4 border-t border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A]">
              <form onSubmit={handleSendMessage} className="space-y-2">
                <div className="relative flex items-center bg-[#F7F8F6] dark:bg-[#202422] rounded-xl border border-transparent focus-within:border-[#D9FF3F] focus-within:ring-1 focus-within:ring-[#D9FF3F]/30 transition-colors p-1.5 pl-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isSending ? 'Sending message...' : `Write a message to ${activeConversation.user.name}...`}
                    disabled={isSending}
                    className="flex-1 bg-transparent text-xs sm:text-sm text-[#101212] dark:text-white placeholder-[#B6B8B7] focus:outline-none disabled:opacity-60"
                  />

                  <div className="flex items-center gap-1 text-[#565B59] dark:text-[#B6B8B7] pr-1">
                    <button
                      type="button"
                      onClick={() => showToast('Emoji picker')}
                      className="p-1.5 hover:text-[#101212] dark:hover:text-[#D9FF3F] rounded-lg transition-colors"
                      title="Add emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Attach file')}
                      className="p-1.5 hover:text-[#101212] dark:hover:text-[#D9FF3F] rounded-lg transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Attach image')}
                      className="p-1.5 hover:text-[#101212] dark:hover:text-[#D9FF3F] rounded-lg transition-colors"
                      title="Attach image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    {/* 5th Option: Auto-Reply Toggle Button */}
                    <button
                      type="button"
                      onClick={handleToggleAutoReply}
                      className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold ${
                        isAutoReply
                          ? 'text-[#101212] bg-[#D9FF3F] font-bold shadow-xs'
                          : 'hover:text-[#101212] dark:hover:text-[#D9FF3F] bg-white/5 border border-white/10'
                      }`}
                      title={
                        isAutoReply
                          ? 'Auto-Reply is currently ON (Click to switch to Real 1-on-1 mode)'
                          : 'Auto-Reply is currently OFF (Click to enable assistant auto-reply)'
                      }
                    >
                      <Bot className="w-4 h-4" />
                      <span className="text-[10px] hidden sm:inline">Auto</span>
                    </button>

                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSending}
                      className={`p-2 rounded-xl transition-colors ml-1 ${
                        replyText.trim() && !isSending
                          ? 'bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] font-bold cursor-pointer'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F7F8F6] dark:bg-[#0D0F0F]">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-center text-[#101212] dark:text-[#D9FF3F] shadow-sm mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Your Direct Messages
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1.5 max-w-sm">
              Connect, share pitch decks, and exchange opportunities with founders, mentors, and investors in real-time.
            </p>
            <button
              onClick={() => setIsNewMessageOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#D9FF3F] text-[#101212] rounded-xl text-xs font-bold hover:bg-[#C7F020] transition-colors shadow-sm"
            >
              <SquarePen className="w-4 h-4" />
              <span>Start New Message</span>
            </button>
          </div>
        )}
      </div>

      {/* New Conversation Recipient Modal */}
      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onConversationCreated={(newConvId) => {
          setActiveConversationId(newConvId);
          setMobileView('thread');
        }}
      />
    </div>
  );
};
