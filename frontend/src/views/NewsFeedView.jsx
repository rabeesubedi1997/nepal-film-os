import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Newspaper, ExternalLink, Calendar, Globe, Search, BookOpen,
  Loader, User, Plus, Edit3, Trash2, X, RefreshCw, PenSquare,
  List, Tag, Image, Link
} from 'lucide-react';
import { newsService } from '../services/newsService';
import { Badge, Button, Modal, Input } from '../components/ui';
import { useToastStore } from '../toastStore';
import MediaPicker from '../components/MediaPicker';

export default function NewsFeedView() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const [tab, setTab] = useState('feed');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // Write state
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [editArticle, setEditArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Category management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({});
  const [savingCategory, setSavingCategory] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const fetchData = useCallback(async (pageNum, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await newsService.fetch({
        category: category === 'all' ? undefined : category,
        search: search || undefined,
        page: pageNum,
        perPage: 12,
      });
      const newArticles = data.data || [];
      setArticles(prev => append ? [...prev, ...newArticles] : newArticles);
      setHasMore(data.meta?.has_more ?? false);
      setTotal(data.meta?.total ?? 0);
      setPage(pageNum);
    } catch (err) { console.error('Failed to load news:', err); } finally { setLoading(false); setLoadingMore(false); }
  }, [category, search]);

  const fetchCategories = async () => {
    try {
      const cats = await newsService.fetchCategories();
      setCategories(cats || []);
    } catch (err) { console.error('Failed to load categories:', err); }
  };

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
    fetchData(1);
  }, [category, search]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore || tab !== 'feed') return;
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loadingMore) fetchData(page + 1, true); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, fetchData, tab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await newsService.refresh();
      addToast(res.message || 'Feed refreshed');
      fetchData(1);
    } catch (err) { addToast('Failed to refresh feed', 'error'); } finally { setRefreshing(false); }
  };

  const openWriteArticle = (article = null) => {
    setEditArticle(article);
    setArticleForm(article ? {
      title: article.title,
      description: article.description || '',
      content: article.content || '',
      category_id: article.category_id || '',
      source: article.source || '',
      author_name: article.author_name || '',
      image_url: article.image_url || '',
      external_url: article.external_url || '',
      is_external: article.is_external ?? !article.content,
    } : {
      title: '', description: '', content: '', category_id: '',
      source: '', author_name: '', image_url: '', external_url: '',
      is_external: false,
    });
    setShowWriteModal(true);
  };

  const saveArticle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...articleForm };
      if (!data.category_id) delete data.category_id;
      if (!data.image_url) delete data.image_url;
      if (!data.external_url) delete data.external_url;
      if (editArticle) {
        await newsService.update(editArticle.id, data);
        addToast('Article updated');
      } else {
        await newsService.create(data);
        addToast('Article created');
      }
      setShowWriteModal(false);
      fetchData(1);
    } catch (err) { addToast('Failed to save article', 'error'); } finally { setSaving(false); }
  };

  const deleteArticle = async (id) => {
    if (!confirm('Delete this article?')) return;
    try { await newsService.delete(id); addToast('Article deleted'); fetchData(page); } catch (err) { addToast('Failed to delete', 'error'); }
  };

  const openCategory = (cat = null) => {
    setEditCategory(cat);
    setCategoryForm(cat ? { name: cat.name, color: cat.color || '#3b82f6' } : { name: '', color: '#3b82f6' });
    setShowCategoryModal(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setSavingCategory(true);
    try {
      if (editCategory) {
        await newsService.updateCategory(editCategory.id, categoryForm);
        addToast('Category updated');
      } else {
        await newsService.createCategory(categoryForm);
        addToast('Category created');
      }
      setShowCategoryModal(false);
      fetchCategories();
    } catch (err) { addToast('Failed to save category', 'error'); } finally { setSavingCategory(false); }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category? Articles will be uncategorized.')) return;
    try { await newsService.deleteCategory(id); fetchCategories(); addToast('Category deleted'); } catch (err) { addToast('Failed to delete', 'error'); }
  };

  const sourceCounts = {};
  articles.forEach(a => { if (a.source) sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1; });

  if (loading && tab === 'feed') {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-amber-400" /> News Feed
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{total} articles from Nepal + Global film industry</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh Feed'}
          </button>
          <Button variant="primary" size="sm" onClick={() => openWriteArticle()}>
            <PenSquare className="h-3.5 w-3.5" /> Write News
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {[
          { value: 'feed', label: 'Feed', icon: List },
          { value: 'categories', label: 'Categories', icon: Tag },
        ].map(v => {
          const Icon = v.icon;
          return (
            <button key={v.value} onClick={() => setTab(v.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tab === v.value ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icon className="h-3.5 w-3.5" /> {v.label}
            </button>
          );
        })}
      </div>

      {/* ── Feed Tab ─────────────────────────────────── */}
      {tab === 'feed' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Total Articles</p>
              <p className="text-xl font-black mt-1 text-slate-100">{total}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">All sources</p>
            </div>
            {Object.entries(sourceCounts).slice(0, 3).map(([source, count]) => (
              <div key={source} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold truncate">{source}</p>
                <p className="text-xl font-black mt-1 text-amber-400">{count}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Articles</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit overflow-x-auto">
              <button onClick={() => setCategory('all')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${category === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
                <Globe className="h-3 w-3" /> All
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.slug)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${category === cat.slug ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
                  <Globe className="h-3 w-3" /> {cat.name}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search articles..." className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors" />
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <Newspaper className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No articles found.</p>
                <button onClick={handleRefresh} className="mt-3 text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1 mx-auto">
                  <RefreshCw className="h-3 w-3" /> Refresh feed
                </button>
              </div>
            )}
            {articles.map((a) => (
              <div key={a.id} className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col relative">
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openWriteArticle(a)} className="p-1 text-slate-500 hover:text-amber-400 rounded"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteArticle(a.id)} className="p-1 text-slate-500 hover:text-red-400 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap pr-12">
                  {a.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {a.category.name || a.category}
                    </span>
                  )}
                  {a.source && <span className="text-[10px] text-slate-500">{a.source}</span>}
                </div>
                <h3 className="text-sm font-bold text-slate-200 leading-snug mb-2 line-clamp-2">{a.title}</h3>
                {a.description && <p className="text-xs text-slate-400 leading-relaxed mb-3 flex-1 line-clamp-3">{a.description}</p>}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Calendar className="h-3 w-3" />
                    {a.published_at ? new Date(a.published_at).toLocaleDateString() : 'Unknown'}
                    {a.author_name && (
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {a.author_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/app/news/${a.id}`)}
                      className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 transition-colors">
                      <BookOpen className="h-3 w-3" /> Read
                    </button>
                    {a.external_url && (
                      <a href={a.external_url} target="_blank" rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors" title="Open original">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="flex items-center justify-center py-6">
              {loadingMore && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader className="h-4 w-4 animate-spin" /> Loading more...</div>}
            </div>
          )}
          {!hasMore && articles.length > 0 && (
            <p className="text-center text-xs text-slate-600 py-4">Showing all {total} articles</p>
          )}
        </>
      )}

      {/* ── Categories Tab ──────────────────────────── */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => openCategory()}>
              <Plus className="h-3.5 w-3.5" /> Add Category
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 text-sm">No categories yet.</div>
            )}
            {categories.map(cat => (
              <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#3b82f6' }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{cat.name}</p>
                    <p className="text-[10px] text-slate-500">/{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openCategory(cat)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Write / Edit Article Modal ─────────────── */}
      <Modal open={showWriteModal} onClose={() => setShowWriteModal(false)} title={editArticle ? 'Edit Article' : 'Write News Article'} size="xl">
        <form onSubmit={saveArticle} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Title" value={articleForm.title} onChange={e => setArticleForm(f => ({ ...f, title: e.target.value }))} name="title" required placeholder="Article headline..." />
            </div>
            <Input label="Category" value={articleForm.category_id} onChange={e => setArticleForm(f => ({ ...f, category_id: e.target.value }))} name="category_id"
              options={categories.map(c => ({ value: String(c.id), label: c.name }))} />
            <Input label="Author" value={articleForm.author_name} onChange={e => setArticleForm(f => ({ ...f, author_name: e.target.value }))} name="author_name" placeholder="Your name" />
            <Input label="Source (e.g. OnlineKhabar)" value={articleForm.source} onChange={e => setArticleForm(f => ({ ...f, source: e.target.value }))} name="source" placeholder="Source name" />
            <Input label="External URL" type="url" value={articleForm.external_url} onChange={e => setArticleForm(f => ({ ...f, external_url: e.target.value }))} name="external_url" placeholder="https://..." />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input label="Image URL" type="url" value={articleForm.image_url} onChange={e => setArticleForm(f => ({ ...f, image_url: e.target.value }))} name="image_url" placeholder="https://... or pick from Media" />
            </div>
            <button type="button" onClick={() => setShowMediaPicker(true)}
              className="mb-0.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors">
              <Image className="h-3.5 w-3.5" /> Browse Media
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Description</label>
            <textarea value={articleForm.description} onChange={e => setArticleForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Short description / summary..." />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Full Content</label>
            <textarea value={articleForm.content} onChange={e => setArticleForm(f => ({ ...f, content: e.target.value }))} rows={8}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
              placeholder="Write your article content here..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowWriteModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Saving...</> : editArticle ? 'Update Article' : 'Publish Article'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Media Picker Modal ────────────────────── */}
      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => { setArticleForm(f => ({ ...f, image_url: url })); setShowMediaPicker(false); }}
      />

      {/* ── Category Modal ─────────────────────────── */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={saveCategory} className="space-y-4">
          <Input label="Category Name" value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} name="name" required placeholder="e.g., Bollywood" />
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={categoryForm.color} onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                className="h-9 w-9 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer" />
              <input type="text" value={categoryForm.color} onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors" placeholder="#3b82f6" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={savingCategory}>
              {savingCategory ? <><Loader className="h-3.5 w-3.5 animate-spin" /> Saving...</> : editCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
