import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Car, Trash2, AlertCircle, Bell, ChevronLeft, Search } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { getMessages, sendMessage, deleteMessage } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { Message } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<{ [key: string]: number }>({});
  const [showMobileList, setShowMobileList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMessages();
      // Set up real-time subscription
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, (payload) => {
          // Update messages
          fetchMessages();
          
          // Show notification only if:
          // 1. The message is from a different conversation than the currently selected one
          // 2. The message is not from the current user
          if (payload.new && 
              payload.new.sender_id !== user.id && 
              (!selectedConversation || payload.new.sender_id !== selectedConversation.sender_id)) {
            // Update unread count
            setUnreadMessages(prev => ({
              ...prev,
              [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1
            }));
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages, selectedConversation]);

  const handleScroll = () => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(isNearBottom);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await getMessages(user!.id);
      setMessages(data);

      // Calculate unread messages only for conversations that aren't currently selected
      const unread: { [key: string]: number } = {};
      data.forEach(message => {
        if (message.receiver_id === user!.id && 
            (!selectedConversation || message.sender_id !== selectedConversation.sender_id)) {
          const senderId = message.sender_id;
          unread[senderId] = (unread[senderId] || 0) + 1;
        }
      });
      setUnreadMessages(unread);

      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
        setShowMobileList(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Mesajlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;

    try {
      const message = {
        sender_id: user.id,
        receiver_id: selectedConversation.sender?.id === user.id 
          ? selectedConversation.receiver?.id 
          : selectedConversation.sender?.id,
        listing_id: selectedConversation.listing?.id,
        content: newMessage.trim()
      };

      await sendMessage(message);
      setNewMessage('');
      await fetchMessages();
      setIsAtBottom(true);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      toast.error('Mesaj gönderilemedi');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user || deleting) return;
    setDeleting(messageId);

    try {
      await deleteMessage(messageId, user.id);
      await fetchMessages();
      setShowDeleteConfirm(null);
      toast.success('Mesaj silindi');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Mesaj silinemedi');
    } finally {
      setDeleting(null);
    }
  };

  const getOtherUser = (message: Message) => {
    if (!user) return null;
    return message.sender?.id === user.id ? message.receiver : message.sender;
  };

  const getConversationMessages = (selectedMessage: Message) => {
    return messages.filter(m => 
      (m.sender_id === selectedMessage.sender_id && m.receiver_id === selectedMessage.receiver_id) ||
      (m.sender_id === selectedMessage.receiver_id && m.receiver_id === selectedMessage.sender_id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const getFilteredConversations = () => {
    const conversations = new Map();
    messages.forEach(message => {
      const otherId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
      if (!conversations.has(otherId)) {
        conversations.set(otherId, message);
      }
    });
    
    return Array.from(conversations.values()).filter(message => {
      const otherUser = getOtherUser(message);
      const searchLower = searchTerm.toLowerCase();
      
      return (
        otherUser?.full_name?.toLowerCase().includes(searchLower) ||
        message.listing?.brand?.toLowerCase().includes(searchLower) ||
        message.listing?.model?.toLowerCase().includes(searchLower) ||
        message.content?.toLowerCase().includes(searchLower)
      );
    });
  };

  const handleSelectConversation = (message: Message) => {
    const otherUser = getOtherUser(message);
    
    // Clear unread count for this conversation immediately
    if (otherUser?.id) {
      setUnreadMessages(prev => ({
        ...prev,
        [otherUser.id]: 0
      }));
    }

    // Update selected conversation and mobile view state
    setSelectedConversation(message);
    setShowMobileList(false);
    setIsAtBottom(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-gray-600 dark:text-gray-300">
        Yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-colors duration-200 h-[calc(100vh-7rem)] md:h-[calc(100vh-8rem)]"
    >
      <div className="grid md:grid-cols-3 h-full">
        {/* Conversations List */}
        <div className={`border-r dark:border-gray-700 ${showMobileList ? 'block' : 'hidden md:block'} h-full overflow-hidden flex flex-col`}>
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Mesajlar</h2>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mesajlarda ara..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {getFilteredConversations().length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Arama sonucu bulunamadı.' : 'Henüz mesajınız yok.'}
              </div>
            ) : (
              getFilteredConversations().map((message) => {
                const otherUser = getOtherUser(message);
                const unreadCount = unreadMessages[otherUser?.id || ''] || 0;
                const lastMessage = messages
                  .filter(m => 
                    (m.sender_id === message.sender_id && m.receiver_id === message.receiver_id) ||
                    (m.sender_id === message.receiver_id && m.receiver_id === message.sender_id)
                  )
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                return (
                  <div
                    key={message.id}
                    onClick={() => handleSelectConversation(message)}
                    className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors relative ${
                      selectedConversation?.id === message.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 dark:text-white truncate">
                          {otherUser?.full_name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <Car className="w-4 h-4 flex-shrink-0" />
                          <p className="truncate">
                            {message.listing?.brand} {message.listing?.model}
                          </p>
                        </div>
                        {lastMessage && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                            {lastMessage.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(lastMessage?.created_at || message.created_at), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Messages */}
        <div className={`col-span-2 flex flex-col h-full ${!showMobileList ? 'block' : 'hidden md:block'}`}>
          {selectedConversation ? (
            <>
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                <div className="p-4 flex items-center space-x-3">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                      {getOtherUser(selectedConversation)?.full_name}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Car className="w-4 h-4 flex-shrink-0" />
                      <p className="truncate">
                        {selectedConversation.listing?.brand} {selectedConversation.listing?.model}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                ref={messageContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
              >
                {getConversationMessages(selectedConversation).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg relative group ${
                        message.sender_id === user?.id
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString('tr-TR')}
                      </p>
                      {message.sender_id === user?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(message.id);
                          }}
                          className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="sticky bottom-0 left-0 right-0 border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    Gönder
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Mesajlaşmak için bir konuşma seçin
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">Mesajı Sil</h3>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Bu mesajı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDeleteMessage(showDeleteConfirm)}
                  disabled={deleting === showDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  {deleting === showDeleteConfirm ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Siliniyor...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sil</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Messages;