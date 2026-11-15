import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationsApi } from '../api/notifications';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Today, ${new Date(dateStr).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-RW', { day: 'numeric', month: 'short' });
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Poll unread count every 60s when logged in
  useEffect(() => {
    if (!user) return;
    const fetchCount = () =>
      notificationsApi
        .getUnreadCount()
        .then((res) => setUnreadCount((res && res.data && res.data.unreadCount) || 0))
        .catch(() => {});
    fetchCount();
    const timer = setInterval(fetchCount, 60000);
    return () => clearInterval(timer);
  }, [user]);

  const handleOpen = () => {
    // Guest: redirect to login
    if (!user) {
      navigate('/login');
      return;
    }
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      setLoading(true);
      notificationsApi
        .getMine({ limit: 20 })
        .then((res) => {
          setNotifications((res && res.data) || []);
          setUnreadCount((res && res.unreadCount) || 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const handleMarkAllRead = () => {
    notificationsApi
      .markAllRead()
      .then(() => {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      })
      .catch(() => {});
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      notificationsApi.markRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.action_type === 'VIP_DEAL' && notif.action_id) {
      navigate(`/listing/${notif.action_id}`);
      setOpen(false);
    } else if (notif.action_type === 'NEWS' && notif.action_id) {
      navigate(`/news/${notif.action_id}`);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button always visible */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown only when open and logged in */}
      {open && user && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-gray-900 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-green-700 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">We'll let you know when something happens</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !notif.is_read ? 'bg-green-50/60' : ''
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{notif.icon || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5">
                      {!notif.is_read && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-green-600 shrink-0" />
                      )}
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        {notif.title}
                      </p>
                    </div>
                    {notif.summary && (
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5 line-clamp-2">
                        {notif.summary}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5 text-center">
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="text-xs font-semibold text-green-700 hover:underline"
            >
              See all news &amp; alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
