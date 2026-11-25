import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationsApi } from '../api/notifications';
import { newsApi } from '../api/news';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { initialNews } from '../data/translations';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return dateStr;
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
  const { t } = useApp();
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

  // Poll unread count every 60s when logged in, or show news alerts for guests
  useEffect(() => {
    if (!user) {
      newsApi.getAll()
        .then((res) => {
          const items = Array.isArray(res?.data) && res.data.length > 0 ? res.data : initialNews;
          const mapped = items.slice(0, 5).map((n) => ({
            id: n.id,
            icon: n.icon || '📰',
            title: n.title,
            summary: n.summary,
            created_at: n.published_at || n.created_at || n.date,
            is_read: false,
            action_type: 'NEWS',
            action_id: n.id,
          }));
          setNotifications(mapped);
          setUnreadCount(mapped.length);
        })
        .catch(() => {
          const mapped = initialNews.slice(0, 4).map((n) => ({
            id: n.id,
            icon: n.icon || '📰',
            title: n.title,
            summary: n.summary,
            created_at: n.date,
            is_read: false,
            action_type: 'NEWS',
            action_id: n.id,
          }));
          setNotifications(mapped);
          setUnreadCount(mapped.length);
        });
      return;
    }

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
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && user) {
      setLoading(true);
      notificationsApi
        .getMine({ limit: 20 })
        .then((res) => {
          const list = (res && res.data) || [];
          if (list.length > 0) {
            setNotifications(list);
            setUnreadCount((res && res.unreadCount) || list.filter((n) => !n.is_read).length);
          } else {
            // Fallback to latest news items if user has no personal notifications yet
            const mapped = initialNews.slice(0, 4).map((n) => ({
              id: n.id,
              icon: n.icon || '📰',
              title: n.title,
              summary: n.summary,
              created_at: n.date,
              is_read: true,
              action_type: 'NEWS',
              action_id: n.id,
            }));
            setNotifications(mapped);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (user) {
      notificationsApi.markAllRead().catch(() => {});
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      if (user) notificationsApi.markRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (notif.action_type === 'VIP_DEAL' && notif.action_id) {
      navigate(`/listing/${notif.action_id}`);
    } else if (notif.action_type === 'NEWS' || notif.action_type === 'ARTICLE') {
      navigate(notif.action_id ? `/news/${notif.action_id}` : '/news');
    } else {
      navigate('/news');
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label={t('notif_title')}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-gray-900 text-sm">{t('notif_title')}</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-brand-green hover:underline cursor-pointer"
              >
                {t('notif_mark_read')}
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('notif_empty')}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.is_read ? 'bg-green-50/60' : ''
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{notif.icon || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5">
                      {!notif.is_read && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-green shrink-0" />
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

          <div className="border-t border-gray-100 px-4 py-2.5 text-center flex items-center justify-between">
            <button
              onClick={() => { navigate('/news'); setOpen(false); }}
              className="text-xs font-semibold text-brand-green hover:underline cursor-pointer"
            >
              {t('notif_see_all')} →
            </button>
            <button
              onClick={() => { navigate('/vip-room'); setOpen(false); }}
              className="text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
            >
              ⭐ {t('nav_vip')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
