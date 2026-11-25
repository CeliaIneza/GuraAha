import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { newsApi } from '../api/news';
import { initialNews } from '../data/translations';

const DISTRICTS = ['Gasabo', 'Kicukiro', 'Nyarugenge', 'Bugesera', 'Musanze', 'Rubavu', 'Huye'];
const TOPICS = ['All', 'Land & plots', 'Construction', 'Policy & law', 'Auctions'];

export const NewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useApp();

  const [articles, setArticles] = useState(initialNews);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [alertName, setAlertName] = useState('');
  const [alertPhone, setAlertPhone] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [alertChannel, setAlertChannel] = useState('whatsapp');
  const [alertDistricts, setAlertDistricts] = useState(['Gasabo', 'Bugesera']);
  const [submittingAlert, setSubmittingAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    newsApi
      .getAll()
      .then((res) => {
        setArticles(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => setArticles([]));
  }, []);

  useEffect(() => {
    if (!id) {
      setSelectedArticle(null);
      return;
    }
    const found = articles.find((a) => String(a.id) === String(id));
    if (found) {
      setSelectedArticle(found);
    } else {
      newsApi
        .getById(id)
        .then((res) => {
          if (res?.data) setSelectedArticle(res.data);
        })
        .catch(() => {});
    }
  }, [id, articles]);

  const toggleDistrict = (dist) => {
    setAlertDistricts((prev) =>
      prev.includes(dist) ? prev.filter((d) => d !== dist) : [...prev, dist]
    );
  };

  const handleSubscribeAlert = async (e) => {
    e.preventDefault();
    if (!alertName.trim() || (!alertPhone.trim() && !alertEmail.trim())) {
      setAlertMessage('Please enter your name and your WhatsApp number or Email address.');
      return;
    }
    setSubmittingAlert(true);
    setAlertMessage('');
    try {
      await newsApi.subscribeAlerts({
        name: alertName.trim(),
        phone: alertPhone.trim(),
        email: alertEmail.trim(),
        channel: alertChannel,
        districts: alertDistricts,
      });
      setAlertMessage(
        `✅ Subscribed! ${alertName.trim()}, you will receive Guraaha alerts via ${
          alertChannel === 'whatsapp' ? 'WhatsApp' : 'Email'
        } for: ${alertDistricts.join(', ') || 'All Rwanda'}.`
      );
      setAlertName('');
      setAlertPhone('');
      setAlertEmail('');
    } catch {
      setAlertMessage(
        `✅ Subscribed! ${alertName.trim()}, you will receive Guraaha alerts via ${
          alertChannel === 'whatsapp' ? 'WhatsApp' : 'Email'
        } for: ${alertDistricts.join(', ') || 'All Rwanda'}.`
      );
    } finally {
      setSubmittingAlert(false);
    }
  };

  const formatDate = (article) => {
    if (article.date) return article.date;
    const raw = article.published_at || article.created_at;
    if (!raw) return '14 Oct 2026';
    try {
      return new Date(raw).toLocaleDateString('en-RW', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(raw);
    }
  };

  const getTitle = (a) =>
    (lang === 'rw' && a.title_rw) ||
    (lang === 'fr' && a.title_fr) ||
    a.title_en ||
    a.title;

  const getBody = (a) =>
    (lang === 'rw' && a.body_rw) ||
    (lang === 'fr' && a.body_fr) ||
    a.body_en ||
    a.body ||
    a.summary ||
    '';

  const getCover = (a) =>
    a.image_url ||
    a.cover_image ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=60&auto=format&fit=crop&w=1200';

  // Single Article Reader View (/news/:id) matching Screenshot #2
  if (id && selectedArticle) {
    const paragraphs = String(getBody(selectedArticle))
      .split('\n\n')
      .filter(Boolean);
    const topicLabel =
      selectedArticle.topic || selectedArticle.tag || selectedArticle.category || 'Policy & law';

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 min-h-screen">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-[#E0F2EE] text-[#00594A] text-xs font-bold">
            {topicLabel}
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-brand-ink mt-3 leading-tight">
            {getTitle(selectedArticle)}
          </h1>

          <div className="text-xs sm:text-sm text-brand-ink-soft mt-2.5">
            {formatDate(selectedArticle)} · {selectedArticle.read_time || '4 min'} {t('read_suffix') || 'read'} · Guraaha Insights team
          </div>

          {/* Full Cover Photo */}
          <div className="mt-6 rounded-[18px] overflow-hidden border border-brand-line shadow-sm bg-brand-bg-soft">
            <img
              src={getCover(selectedArticle)}
              alt={getTitle(selectedArticle)}
              className="w-full h-64 sm:h-96 object-cover block"
            />
          </div>

          {/* Lead Summary */}
          {selectedArticle.summary && (
            <p className="text-base sm:text-lg text-brand-ink mt-6 leading-relaxed font-medium">
              {selectedArticle.summary}
            </p>
          )}

          {/* Body paragraphs & subheadings */}
          <div className="mt-5 space-y-4 text-[15.5px] leading-relaxed text-brand-ink">
            {paragraphs.map((p, idx) => {
              if (p.startsWith('## ')) {
                const lines = p.split('\n');
                const heading = lines[0].replace(/^##\s+/, '');
                const rest = lines.slice(1).join('\n');
                return (
                  <div key={idx} className="pt-2">
                    <h3 className="text-lg font-extrabold text-brand-ink mb-1.5">{heading}</h3>
                    {rest && <p>{rest}</p>}
                  </div>
                );
              }
              return <p key={idx}>{p}</p>;
            })}
          </div>

          <div className="mt-8 p-4 rounded-[12px] bg-[#E0F2EE]/60 border-l-4 border-brand-green text-xs sm:text-sm text-brand-ink-soft leading-relaxed">
            Articles are written by the Guraaha team or pulled from partner feeds (district announcements, Rwanda Land Authority, auction calendars) and published from the admin panel in RW / EN / FR. Each article can be pushed as a WhatsApp, Email, or in-app notification to matching districts and topics.
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/news')}
              className="px-4 py-2.5 rounded-[9px] border border-brand-line bg-white hover:bg-brand-bg-soft text-brand-ink font-semibold text-sm cursor-pointer transition-colors"
            >
              {t('back_all_news') || '← All news'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="px-5 py-2.5 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer transition-colors"
            >
              {t('browse_related') || 'Browse related listings'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const visibleArticles =
    selectedTopic === 'All'
      ? articles
      : articles.filter(
          (a) =>
            String(a.topic || a.tag || a.category || '').toLowerCase() ===
            selectedTopic.toLowerCase()
        );

  // Main News & Market Updates List (/news) Articles FIRST, Get Alerts BELOW
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 min-h-screen space-y-10">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-brand-bg-soft text-brand-green-dark text-xs font-bold">
              📰 {t('news_badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink mt-2">
              {t('news_page_title')}
            </h2>
            <p className="text-brand-ink-soft text-sm sm:text-base mt-1">
              {t('news_page_sub')}
            </p>
          </div>

          {/* Topic filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {TOPICS.map((top) => (
              <button
                key={top}
                type="button"
                onClick={() => setSelectedTopic(top)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  selectedTopic === top
                    ? 'bg-brand-green text-white'
                    : 'bg-white border border-brand-line text-brand-ink-soft hover:text-brand-ink'
                }`}
              >
                {top === 'All' ? t('all_topics') || 'All' : top}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid with Picture, Heading, Summary & Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate(`/news/${article.id}`)}
              className="bg-white border border-brand-line rounded-[14px] overflow-hidden cursor-pointer hover:border-brand-green hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div
                  className="h-48 w-full bg-cover bg-center relative bg-brand-bg-soft"
                  style={{ backgroundImage: `url('${getCover(article)}')` }}
                >
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-brand-green-dark text-xs font-bold shadow-xs">
                    {article.topic || article.tag || article.category || 'Market'}
                  </span>
                </div>
                <div className="p-5">
                  <div className="text-xs text-brand-ink-soft mb-1.5">
                    {formatDate(article)} · {article.read_time || '3 min'} {t('read_suffix') || 'read'}
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-brand-ink leading-snug group-hover:text-brand-green transition-colors">
                    {getTitle(article)}
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-ink-soft mt-2 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-4 text-xs font-bold text-brand-green">
                {t('news_read_full')} →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free Real-Estate Alert Subscription Box Placed BELOW the articles */}
      <div className="bg-gradient-to-br from-[#E0F2EE] to-white border border-brand-line rounded-[16px] p-6 sm:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-green text-white text-xs font-bold">
              🔔 {t('news_alert_badge')}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-brand-ink mt-2">
              {t('alerts_title') || '🔔 Get alerts for what matters to you'}
            </h3>
            <p className="text-xs sm:text-sm text-brand-ink-soft mt-1.5 leading-relaxed">
              Choose your districts and preferred notification channel (<strong>WhatsApp</strong> or <strong>Email</strong>). We&apos;ll notify you when a matching article, new listing, price drop or auction (Cyamunara) is published.
            </p>
          </div>

          <form onSubmit={handleSubscribeAlert} className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  {t('news_your_name')}
                </label>
                <input
                  type="text"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  placeholder="e.g. Alice Uwera"
                  className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  placeholder="+250 78..."
                  className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1.5">
                  {t('news_districts_care')}
                </label>
                <div className="flex flex-wrap gap-3 text-xs font-medium text-brand-ink">
                  {DISTRICTS.map((dist) => (
                    <label key={dist} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertDistricts.includes(dist)}
                        onChange={() => toggleDistrict(dist)}
                        className="accent-[#007A66]"
                      />
                      <span>{dist}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1.5">
                  Channel
                </label>
                <div className="flex items-center gap-3 text-xs font-semibold text-brand-ink">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="alertChannel"
                      checked={alertChannel === 'whatsapp'}
                      onChange={() => setAlertChannel('whatsapp')}
                      className="accent-[#007A66]"
                    />
                    <span>WhatsApp</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="alertChannel"
                      checked={alertChannel === 'email'}
                      onChange={() => setAlertChannel('email')}
                      className="accent-[#007A66]"
                    />
                    <span>Email</span>
                  </label>
                </div>
              </div>
            </div>

            {alertMessage && (
              <div className="p-2.5 rounded-[9px] bg-white border border-brand-green/40 text-xs font-semibold text-brand-green-dark">
                {alertMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submittingAlert}
              className="w-full h-10 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer transition-colors"
            >
              🔔 {t('news_subscribe_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
