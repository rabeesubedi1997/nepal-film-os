import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, User, Globe, Newspaper, Loader } from 'lucide-react';
import { newsService } from '../services/newsService';
import SeoHead from '../components/SeoHead'

export default function NewsArticleReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await newsService.fetchOne(id);
        setArticle(data);
      } catch (err) {
        setError('Failed to load article.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading article...</span>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Newspaper className="h-12 w-12 text-slate-700" />
        <p className="text-slate-500 text-sm">{error || 'Article not found.'}</p>
        <button onClick={() => navigate(-1)} className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Go Back
        </button>
      </div>
    );
  }

  const articleJsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description || article.content?.slice(0, 200),
    image: article.image_url,
    author: article.author_name ? { '@type': 'Person', name: article.author_name } : undefined,
    datePublished: article.published_at,
    publisher: { '@type': 'Organization', name: 'Nepal Film OS' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://filmos.kitetool.com/app/news/${id}` },
  } : null

  return (
    <>
      <SeoHead title={article.title} description={article.description || `Read ${article.title} on Nepal Film OS`} image={article.image_url} url={`/app/news/${id}`} type="article" publishedTime={article.published_at} author={article.author_name} jsonLd={articleJsonLd} />
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to News Feed
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {article.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {article.category.name || article.category}
            </span>
          )}
          {article.source && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Globe className="h-3 w-3" /> {article.source}
            </span>
          )}
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug mb-4">{article.title}</h1>

        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          {article.author_name && (
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> {article.author_name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date'}
          </span>
        </div>
      </div>

      {/* Image */}
      {article.image_url && (
        <div className="rounded-xl overflow-hidden border border-slate-800">
          <img src={article.image_url} alt={article.title} className="w-full h-auto max-h-96 object-cover" loading="lazy" />
        </div>
      )}

      {/* Description */}
      {article.description && (
        <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">{article.description}</p>
      )}

      {/* Content */}
      {article.content && (
        <div className="text-sm md:text-base text-slate-400 leading-relaxed space-y-3">
          {article.content.split('\n').map((paragraph, i) => (
            paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
        {article.external_url && (
          <a href={article.external_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-all">
            <ExternalLink className="h-4 w-4" /> Read Original Source
          </a>
        )}
        <button onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-300 px-4 py-2.5 transition-colors">
          Back to Feed
        </button>
      </div>
    </div>
    </>
  );
}
