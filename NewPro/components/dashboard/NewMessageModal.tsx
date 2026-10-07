'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import { messagingService } from '@/lib/messagingService';
import { connectionService, CONNECTIONS_UPDATED_EVENT } from '@/lib/connectionService';
import { getUserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';

export interface RecipientOption {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar: string;
  category?: 'mentor' | 'startup' | 'investor' | 'esp';
  verified?: boolean;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [connectedPartners, setConnectedPartners] = useState<Array<{ id: string; name: string; role: string; avatar: string }>>([]);

  const currentProfile = getUserProfile();
  const currentUserId = currentProfile.id || '';
  const currentUserName = (currentProfile.name || '').toLowerCase().trim();

  // Load connected partners strictly from connectionService
  useEffect(() => {
    if (!isOpen) return;

    const loadConnections = () => {
      const partners = connectionService.getConnectedPartners();
      // Filter out self if somehow present
      const filtered = partners.filter(
        (p) => p.id !== currentUserId && p.name.toLowerCase().trim() !== currentUserName
      );
      setConnectedPartners(filtered);
    };

    loadConnections();
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, loadConnections);
    window.addEventListener('xentro-connection-event', loadConnections);
    return () => {
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, loadConnections);
      window.removeEventListener('xentro-connection-event', loadConnections);
    };
  }, [isOpen, currentUserId, currentUserName]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return connectedPartners;
    return connectedPartners.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
    );
  }, [connectedPartners, searchQuery]);

  if (!isOpen) return null;

  const handleSelectContact = (contact: { id: string; name: string; role: string; avatar: string }) => {
    // Check connection rule strictly
    const status = connectionService.getConnectionStatus(contact.id);
    if (status !== 'connected') {
      showToast('Messaging requires an accepted connection. Send a connection request first.', 'error');
      return;
    }

    const convId = messagingService.startOrOpenConversation({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      avatar: contact.avatar,
    });
    showToast(`Conversation opened with ${contact.name}`);
    onConversationCreated(convId);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center font-bold shadow-sm">
              <MessageSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-manrope font-bold text-base sm:text-lg text-[#101212] dark:text-white">
                New Conversation
              </h2>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Connect and exchange messages with your accepted network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Rule Notice Banner */}
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/30 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Connection Required:</strong> You can only message users who have accepted your connection request.
          </span>
        </div>

        {/* Search Input */}
        {connectedPartners.length > 0 && (
          <div className="p-4 border-b border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6]/50 dark:bg-[#121413]/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#565B59] dark:text-[#B6B8B7]" />
              <input
                type="text"
                placeholder="Search connected partners by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2B302E] bg-white dark:bg-[#181B1A] text-xs sm:text-sm text-[#101212] dark:text-white placeholder-[#B6B8B7] focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]/30"
              />
            </div>
          </div>
        )}

        {/* Contacts Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]/60 dark:divide-[#262A29]/60 p-2 sm:p-3 min-h-[220px]">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(contact)}
                className="w-full p-3 rounded-xl flex items-center justify-between text-left hover:bg-[#F7F8F6] dark:hover:bg-[#202422] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="relative w-10 h-10 rounded-full bg-[#101212] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#E5E7EB] dark:border-[#262A29]">
                    <img
                      src={contact.avatar || '/xentro-logo.png'}
                      alt={contact.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#181B1A]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-[#101212] dark:text-white truncate group-hover:text-[#88A800] dark:group-hover:text-[#D9FF3F] transition-colors">
                        {contact.name}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D9FF3F] fill-[#101212] flex-shrink-0" />
                    </div>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] truncate">
                      {contact.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
                    <UserCheck className="w-3 h-3" />
                    Connected
                  </span>
                  <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D9FF3F] text-[#101212] group-hover:bg-[#C7F020] transition-colors flex items-center gap-1 shadow-sm">
                    <span>Message</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            ))
          ) : connectedPartners.length === 0 ? (
            <div className="py-10 text-center px-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#202422] flex items-center justify-center mx-auto text-[#565B59] dark:text-[#B6B8B7]">
                <UserPlus className="w-7 h-7 opacity-70" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-sm font-bold text-[#101212] dark:text-white">
                  No Connected Contacts Yet
                </h4>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                  Per Xentro policy, messaging becomes available once a connection request is accepted. Explore the recommendations or feed to connect with founders, mentors, and investors!
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('xentro-navigate-tab', { detail: { tab: 'feed' } }));
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Find People to Connect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="py-8 text-center px-4 space-y-2">
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                No connected partners matching "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
