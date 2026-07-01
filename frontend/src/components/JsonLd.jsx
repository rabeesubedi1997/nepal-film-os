import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://filmos.kitetool.com'
const LOGO_URL = `${SITE_URL}/vite.svg`

export function OrganizationLd() {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Nepal Film OS',
          url: SITE_URL,
          logo: LOGO_URL,
          description: 'Film production management platform for Nepali cinema.',
          foundingLocation: { '@type': 'Place', name: 'Nepal' },
          areaServed: { '@type': 'Country', name: 'Nepal' },
          applicationCategory: 'BusinessApplication',
        })}
      </script>
    </Helmet>
  )
}

export function SoftwareAppLd() {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Nepal Film OS',
          operatingSystem: 'Web',
          applicationCategory: 'BusinessApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'NPR' },
          description: 'Film production management platform for Nepali cinema — manage schedules, budgets, scripts, cast & crew, and more.',
          url: SITE_URL,
        })}
      </script>
    </Helmet>
  )
}

export function WebSiteLd() {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Nepal Film OS',
          url: SITE_URL,
          description: 'Film production management platform for Nepali cinema.',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        })}
      </script>
    </Helmet>
  )
}
