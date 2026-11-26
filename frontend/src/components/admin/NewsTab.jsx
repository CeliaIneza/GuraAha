import React, { useEffect, useState } from 'react';
import { newsApi } from '../../api/news';
import { initialNews } from '../../data/translations';
import { mediaUrl } from '../../utils/listing';
import { Newspaper, Plus, Trash2, Edit2, Send, Eye, EyeOff, X, Upload, Loader2 } from 'lucide-react';
import { RowActions } from './RowActions';
import { Panel, RefreshButton, tableClass, theadClass, tbodyClass, rowClass } from './AdminShared';

const emptyArticle = {
  icon: '📰',
  tag: 'Policy & law',
  title: '',
  summary: '',
  body: '',
  imageUrl: '',
  audience: 'all',
  isPublished: true,
};

export const NewsTab = ({ showToast }) => {
  const [articles, setArticles] = useState(initialNews);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingArticle, setViewingArticle] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyArticle);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await newsApi.adminGetAll();
      setArticles(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyArticle);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      icon: a.icon || '📰',
      tag: a.topic || a.tag || a.category || 'Market',
      title: a.title_en || a.title || '',
      summary: a.summary || '',
      body: a.body_en || a.body || a.summary || '',
      imageUrl: a.image_url || a.cover_image || '',
      audience: a.audience || 'all',
      isPublished: a.is_published ?? a.published ?? true,
    });
    setModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await newsApi.uploadImage(file);
      const uploadedUrl = res?.data?.imageUrl;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        showToast('Cover picture uploaded.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload picture');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) {
      showToast('Title and summary are required.');
      return;
    }
    try {
      const payload = {
        icon: form.icon,
        category: form.tag,
        topic: form.tag,
        tag: form.tag,
        title: form.title.trim(),
        titleEn: form.title.trim(),
        summary: form.summary.trim(),
        body: form.body.trim() || form.summary.trim(),
        bodyEn: form.body.trim() || form.summary.trim(),
        imageUrl: form.imageUrl.trim(),
        audience: form.audience,
        isPublished: form.isPublished,
      };
      if (editing) {
        await newsApi.update(editing.id, payload);
        showToast('Article updated.');
      } else {
        await newsApi.create(payload);
        showToast('Article created.');
      }
      setModalOpen(false);
      loadArticles();
    } catch (err) {
      showToast(err.message || 'Failed to save article');
    }
  };

  const handleTogglePublished = async (a) => {
    const current = a.is_published ?? a.published ?? true;
    try {
      await newsApi.update(a.id, { isPublished: !current });
      showToast(!current ? 'Article published.' : 'Article unpublished.');
      loadArticles();
    } catch (err) {
      showToast(err.message || 'Failed to update status');
    }
  };

  const handlePush = async (a) => {
    try {
      await newsApi.pushNotification(a.id);
      showToast(`🔔 Notification pushed via in-app bell, WhatsApp & Email: "${a.title_en || a.title}"`);
      loadArticles();
    } catch (err) {
      showToast(err.message || 'Failed to push notification');
    }
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete article "${a.title_en || a.title}"?`)) return;
    try {
      await newsApi.delete(a.id);
      showToast('Article deleted.');
      loadArticles();
    } catch (err) {
      showToast(err.message || 'Failed to delete article');
    }
  };

  const getCover = (a) => {
    const raw = a?.image_url || a?.cover_image;
    return (
      mediaUrl(raw) ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=60&auto=format&fit=crop&w=1200'
    );
  };

  return (
    <Panel
      icon={Newspaper}
      title={`News & Notifications (${articles.length})`}
      subtitle="Publish market updates, guides, and push real-time notifications to the Header bell, WhatsApp & Email"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAdd}
            className="h-9 px-3.5 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Article / Notification</span>
          </button>
          <RefreshButton onClick={loadArticles} loading={loading} />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className={`${tableClass} min-w-[820px]`}>
          <thead className={theadClass}>
            <tr>
              <th className="py-3 px-4">Article</th>
              <th className="py-3 px-4">Topic</th>
              <th className="py-3 px-4">Audience</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {articles.map((a) => {
              const isPub = a.is_published ?? a.published ?? true;
              const isPushed = a.is_pushed ?? a.pushed ?? false;
              const title = a.title_en || a.title;
              return (
                <tr key={a.id} className={rowClass}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getCover(a)}
                        alt={title}
                        className="w-14 h-10 rounded-lg object-cover border border-brand-line shrink-0"
                      />
                      <div>
                        <button
                          type="button"
                          onClick={() => setViewingArticle(a)}
                          className="font-bold text-sm text-brand-ink hover:text-brand-green hover:underline text-left cursor-pointer"
                        >
                          {title}
                        </button>
                        <div className="text-xs text-brand-ink-soft line-clamp-1 max-w-md">
                          {a.summary}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-brand-green-dark">
                    {a.topic || a.tag || a.category || 'Market'}
                  </td>
                  <td className="py-3 px-4 text-xs capitalize text-brand-ink-soft">
                    {a.audience || 'all'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isPub
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isPub ? 'Published' : 'Draft'}
                      </span>
                      {isPushed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          🔔 Pushed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <RowActions
                      label={`Actions for ${title}`}
                      actions={[
                        {
                          label: 'View article',
                          icon: Eye,
                          onClick: () => setViewingArticle(a),
                        },
                        {
                          label: '🔔 Push notification',
                          icon: Send,
                          onClick: () => handlePush(a),
                        },
                        {
                          label: isPub ? 'Unpublish article' : 'Publish article',
                          icon: isPub ? EyeOff : Eye,
                          onClick: () => handleTogglePublished(a),
                        },
                        {
                          label: 'Edit article',
                          icon: Edit2,
                          onClick: () => openEdit(a),
                        },
                        {
                          label: 'Delete permanently',
                          icon: Trash2,
                          destructive: true,
                          onClick: () => handleDelete(a),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Full Article Preview Modal (View with full picture & full details matching Screenshot #2) */}
      {viewingArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingArticle(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-brand-line overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-brand-line flex items-center justify-between bg-brand-bg-soft/50">
              <span className="inline-block px-3 py-1 rounded-full bg-[#E0F2EE] text-[#00594A] text-xs font-bold">
                {viewingArticle.topic || viewingArticle.tag || viewingArticle.category || 'Market'}
              </span>
              <button
                type="button"
                onClick={() => setViewingArticle(null)}
                className="p-1.5 rounded-full hover:bg-gray-200/70 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-ink leading-tight">
                {viewingArticle.title_en || viewingArticle.title}
              </h2>
              <div className="text-xs text-brand-ink-soft">
                {viewingArticle.date || '14 Oct 2026'} · {viewingArticle.read_time || '4 min'} read · Guraaha Insights team
              </div>

              <div className="rounded-[16px] overflow-hidden border border-brand-line bg-brand-bg-soft">
                <img
                  src={getCover(viewingArticle)}
                  alt={viewingArticle.title_en || viewingArticle.title}
                  className="w-full h-72 object-cover block"
                />
              </div>

              {viewingArticle.summary && (
                <p className="text-base font-medium text-brand-ink leading-relaxed">
                  {viewingArticle.summary}
                </p>
              )}

              <div className="space-y-3 text-sm sm:text-base text-brand-ink leading-relaxed">
                {String(viewingArticle.body_en || viewingArticle.body || viewingArticle.summary || '')
                  .split('\n\n')
                  .filter(Boolean)
                  .map((p, idx) => (
                    <p key={idx}>{p.replace(/^##\s+/, '')}</p>
                  ))}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-brand-line bg-brand-bg-soft/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewingArticle(null)}
                className="px-4 py-2 rounded-[9px] border border-brand-line bg-white text-xs font-semibold text-brand-ink cursor-pointer"
              >
                Close Preview
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const a = viewingArticle;
                    setViewingArticle(null);
                    openEdit(a);
                  }}
                  className="px-4 py-2 rounded-[9px] border border-brand-line bg-white text-xs font-semibold text-brand-ink cursor-pointer"
                >
                  Edit Article
                </button>
                <button
                  type="button"
                  onClick={() => handlePush(viewingArticle)}
                  className="px-4 py-2 rounded-[9px] bg-brand-green text-white text-xs font-bold cursor-pointer"
                >
                  🔔 Push Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="bg-white rounded-[14px] border border-brand-line p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-brand-bg-soft text-brand-ink-soft cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-brand-ink mb-4">
              {editing ? 'Edit Article / Notification' : 'New Article / Notification'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Topic / Category
                  </label>
                  <input
                    type="text"
                    value={form.tag}
                    onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))}
                    placeholder="Land & plots / Construction / Policy & law"
                    className="w-full h-10 px-3 rounded-[9px] border border-brand-line text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-ink mb-1">
                    Audience
                  </label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                    className="w-full h-10 px-3 rounded-[9px] border border-brand-line bg-white text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="buyers">Buyers</option>
                    <option value="blockers">Blockers</option>
                    <option value="vip">VIP Members</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1.5">
                  Cover Picture
                </label>
                <div className="p-3 rounded-[10px] border border-dashed border-brand-line bg-brand-bg-soft/40 space-y-2.5">
                  {form.imageUrl && (
                    <div className="relative rounded-[8px] overflow-hidden border border-brand-line bg-white">
                      <img
                        src={mediaUrl(form.imageUrl) || form.imageUrl}
                        alt="Article Cover Preview"
                        className="w-full h-36 object-cover block"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                        className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 hover:bg-black text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Remove picture
                      </button>
                    </div>
                  )}

                  <label className="flex items-center justify-center gap-2 h-10 px-4 rounded-[9px] border border-brand-green/40 bg-white hover:bg-brand-pale text-brand-green text-xs font-bold cursor-pointer transition-colors">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading picture…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>
                          {form.imageUrl ? 'Change Cover Picture' : 'Upload Cover Picture (JPG, PNG, WEBP)'}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Bugesera land prices up 22% in a year"
                  className="w-full h-10 px-3 rounded-[9px] border border-brand-line text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Short Summary *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.summary}
                  onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                  placeholder="1-2 sentence summary shown on cards and notification bell"
                  className="w-full p-3 rounded-[9px] border border-brand-line text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-ink mb-1">
                  Full Article Body (separate paragraphs with a blank line)
                </label>
                <textarea
                  rows={5}
                  value={form.body}
                  onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Full article content..."
                  className="w-full p-3 rounded-[9px] border border-brand-line text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                  className="accent-[#007A66]"
                />
                <span className="text-xs font-semibold text-brand-ink">
                  Publish immediately on News page
                </span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-[9px] bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm cursor-pointer"
                >
                  Save Article
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 px-5 rounded-[9px] border border-brand-line text-brand-ink font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Panel>
  );
};
