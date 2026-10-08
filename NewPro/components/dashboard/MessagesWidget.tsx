'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  ChevronUp,
  Minus,
  Maximize2,
  Minimize2,
  X,
  Search,
  SquarePen,
  ArrowLeft,
  Send,
  ArrowRight,
  Smile,
  Paperclip,
  Bot,
} from 'lucide-react';
import { Conversation, ChatMessage } from '@/types';
import { useToast } from '@/components/ui/Toast';
import {
  messagingService,
  resolveAvatarUrl,
  CONVERSATIONS_UPDATED_EVENT,
  AUTO_REPLY_CHANGED_EVENT,
} from '@/lib/messagingService';
import { NewMessageModal } from './NewMessageModal';

interface MessagesWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const MessagesWidget: React.FC<MessagesWidgetProps> = ({ isOpen, onToggle }) => {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    messagingService.getConversations()
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpandedFull, setIsExpandedFull] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAutoReply, setIsAutoReply] = useState(() => messagingService.isAutoReplyEnabled());
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    messagingService.syncFromServer().then((all) => {
      if (Array.isArray(all) && all.length > 0) {
        setConversations(all);
      }
    });

    const handleUpdated = () => {
      setConversations(messagingService.getConversations());
    };
    const handleAutoReply = () => {
      setIsAutoReply(messagingService.isAutoReplyEnabled());
    };

    window.addEventListener(CONVERSATIONS_UPDATED_EVENT, handleUpdated);
    window.addEventListener(AUTO_REPLY_CHANGED_EVENT, handleAutoReply);

    return () => {
      window.removeEventListener(CONVERSATIONS_UPDATED_EVENT, handleUpdated);
      window.removeEventListener(AUTO_REPLY_CHANGED_EVENT, handleAutoReply);
    };
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const filteredConversations = conversations.filter(
    (c) =>
      (c.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, curr) => acc + curr.unreadCount, 0);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations(messagingService.markRead(id));
    messagingService.fetchConversationMessages(id);
  };

  const handleToggleAutoReply = () => {
    const next = messagingService.toggleAutoReply();
    setIsAutoReply(next);
    showToast(
      next
        ? 'Auto-Reply ON: Assistant will reply to sent messages'
        : 'Auto-Reply OFF: Real 1-on-1 mode active (no bot replies)'
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConversationId || isSending) return;

    setIsSending(true);
    const targetId = activeConversationId;
    const text = replyText.trim();
    setReplyText('');

    setConversations(messagingService.sendMessage(targetId, text));
    setTimeout(() => {
      setIsSending(false);
    }, 600);
  };

  return (
    <>
      {/* 1. COLLAPSED LAUNCHER (Fixed bottom-right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={onToggle}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#D9FF3F] hover:bg-[#C7F020] active:bg-[#9EBE12] active:scale-95 text-[#101212] shadow-floating font-bold text-sm transition-all relative group"
            aria-label="Open Messages panel"
          >
            <div className="relative flex items-center justify-center">
              <MessageCircle className="w-5 h-5 fill-[#101212] text-[#101212]" />
              {totalUnread > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#D9FF3F]">
                  {totalUnread}
                </span>
              )}
            </div>
            <span>Messages</span>
            <ChevronUp className="w-4 h-4 ml-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* 2. EXPANDED FLOATING MESSAGES PANEL */}
      {isOpen && (
        <aside
          aria-label="Floating Messages Panel"
          className={`fixed z-50 bg-white dark:bg-[#181B1A] rounded-2xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] overflow-hidden flex flex-col transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
            /* Mobile full sheet vs Desktop floating panel */
            isExpandedFull
              ? 'inset-4 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[500px] sm:h-[620px]'
              : 'bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[410px] h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between bg-white dark:bg-[#181B1A]">
            {activeConversation ? (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden relative">
                  <img
                    src={resolveAvatarUrl(activeConversation.user.avatar, activeConversation.user.name)}
                    alt={activeConversation.user.name}
                    className="w-full h-full object-cover"
                  />
                  {activeConversation.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#9EBE12] ring-2 ring-white dark:ring-[#181B1A]" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#101212] dark:text-white leading-tight font-heading">
                    {activeConversation.user.name}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {activeConversation.isOnline ? 'Online now' : 'Active recently'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
                  Messages {totalUnread > 0 ? `(${totalUnread})` : ''}
                </h3>
              </div>
            )}

            {/* Window Controls */}
            <div className="flex items-center gap-1 text-[#565B59] dark:text-[#B6B8B7]">
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Minimize"
                aria-label="Minimize messages"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpandedFull(!isExpandedFull)}
                className="hidden sm:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isExpandedFull ? 'Restore' : 'Expand'}
                aria-label="Expand or Restore"
              >
                {isExpandedFull ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Close"
                aria-label="Close messages"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ACTIVE CHAT DETAIL VIEW */}
          {activeConversation ? (
            <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]/50 dark:bg-[#0D0F0F]/50 overflow-hidden">
              {/* Messages thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeConversation.messages.map((msg) => {
                  const isSystem = Boolean((msg as any).isSystem || (msg as any).type === 'system' || msg.text.startsWith('🤝 Connection established'));

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2 animate-fade-in">
                        <div className="max-w-[90%] px-3 py-1.5 rounded-xl bg-black/5 dark:bg-[#181B1A] border border-gray-200/80 dark:border-[#262A29] text-center text-[11px] text-[#565B59] dark:text-[#B6B8B7] shadow-xs">
                          <span>{msg.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          msg.isMe
                            ? 'bg-[#D9FF3F] text-[#101212] font-medium rounded-br-xs shadow-2xs'
                            : 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white border border-gray-100 dark:border-[#262A29] rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-[#565B59] dark:text-[#B6B8B7] mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-[#181B1A] border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => showToast('Attachments supported in demo')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Auto-Reply Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAutoReply}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold ${
                    isAutoReply
                      ? 'text-[#101212] bg-[#D9FF3F] shadow-xs'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white/5 border border-white/10'
                  }`}
                  title={
                    isAutoReply
                      ? 'Auto-Reply is ON (Click for real 1-on-1)'
                      : 'Auto-Reply is OFF (Click for auto bot reply)'
                  }
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Auto</span>
                </button>

                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isSending ? 'Sending...' : `Reply to ${activeConversation.user.name}...`}
                  disabled={isSending}
                  className="flex-1 bg-[#F3F4F6] dark:bg-[#0D0F0F] rounded-full px-4 py-2 text-xs text-[#101212] dark:text-white outline-none focus:ring-1 focus:ring-[#D9FF3F] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="p-2 rounded-full bg-[#D9FF3F] text-[#101212] disabled:opacity-40 hover:bg-[#C7F020] active:bg-[#9EBE12] transition-colors cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* CONVERSATION LIST VIEW */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search + Compose Row */}
              <div className="p-3 border-b border-[#F1F5F9] dark:border-[#262A29] flex items-center gap-2">
                <div className="flex-1 relative flex items-center">
                  <Search className="absolute left-3 w-3.5 h-3.5 text-[#565B59]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full h-8.5 pl-8 pr-3 rounded-xl bg-[#F3F4F6] dark:bg-[#0D0F0F] text-xs text-[#101212] dark:text-white placeholder-[#565B59] outline-none focus:ring-1 focus:ring-[#D9FF3F]"
                  />
                </div>
                <button
                  onClick={() => setIsNewMessageOpen(true)}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[#565B59] dark:text-gray-300 transition-colors"
                  aria-label="Compose new message"
                >
                  <SquarePen className="w-4 h-4" />
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-[#262A29]">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className="p-3.5 hover:bg-gray-50 dark:hover:bg-[#0D0F0F]/60 cursor-pointer transition-colors flex items-start gap-3"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                          <img
                            src={resolveAvatarUrl(conv.user.avatar, conv.user.name)}
                            alt={conv.user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {conv.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#9EBE12] ring-2 ring-white dark:ring-[#181B1A]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-[#101212] dark:text-white truncate font-heading">
                              {conv.user.name}
                            </h4>
                          </div>
                          <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7]">
                            {conv.timestamp}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate mt-0.5">
                          {conv.lastMessage}
                        </p>
                      </div>

                      {conv.unreadCount > 0 && (
                        <div className="w-4 h-4 rounded-full bg-[#D9FF3F] text-[#101212] text-[10px] font-black flex items-center justify-center flex-shrink-0 self-center shadow-2xs">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#202422] flex items-center justify-center text-gray-400 mb-3">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-[#101212] dark:text-white">
                      {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                    </p>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] mt-1 max-w-[220px]">
                      {searchQuery
                        ? 'Try a different search query'
                        : 'Connect with ecosystem members or compose a message to start direct chat.'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setIsNewMessageOpen(true)}
                        className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold hover:bg-[#C7F020] transition-colors shadow-sm"
                      >
                        Start Conversation
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer View All Messages */}
              <div className="p-3 border-t border-[#E5E7EB] dark:border-[#262A29] text-center bg-gray-50/50 dark:bg-[#181B1A]">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(
                        new CustomEvent('xentro-navigate-tab', { detail: { tab: 'messages' } })
                      );
                    }
                    onToggle();
                  }}
                  className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>View all messages</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* New Conversation Recipient Modal */}
      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onConversationCreated={(newConvId) => {
          setActiveConversationId(newConvId);
        }}
      />
    </>
  );
};
