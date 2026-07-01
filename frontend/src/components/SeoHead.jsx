import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Nepal Film OS'
const SITE_URL = 'https://filmos.kitetool.com'
const DEFAULT_DESC = 'Film production management platform for Nepali cinema — manage schedules, budgets, scripts, cast & crew, and more.'
const DEFAULT_IMAGE = '/og-image.png'

export default function SeoHead({ title, description, image, url, type = 'website', publishedTime, author, jsonLd }) {
  const pageTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Film Production Management Platform`
  const desc = description || DEFAULT_DESC
  const img = image || DEFAULT_IMAGE
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta name="author" content={author} />}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}
