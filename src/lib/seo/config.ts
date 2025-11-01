export const SEO_CONFIG = {
  titleTemplate: '%s | Dorety Bakery',
  defaultTitle: 'Dorety Bakery - Fresh Baked Goods & Pastries',
  description: 'Experience the finest baked goods at Dorety Bakery. Fresh breads, pastries, cakes, and desserts made daily with premium ingredients. Order online for delivery or pickup.',
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://doretybakery.com',
    siteName: 'Dorety Bakery',
    images: [
      {
        url: 'https://doretybakery.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Dorety Bakery - Fresh Baked Goods',
        type: 'image/jpeg',
      },
    ],
  },
  
  twitter: {
    handle: '@doretybakery',
    site: '@doretybakery',
    cardType: 'summary_large_image',
  },
  
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
    {
      rel: 'canonical',
      href: 'https://doretybakery.com',
    },
  ],
  
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      name: 'theme-color',
      content: '#8B4513',
    },
    {
      name: 'msapplication-TileColor',
      content: '#8B4513',
    },
    {
      name: 'author',
      content: 'Dorety Bakery',
    },
    {
      property: 'business:contact_data:street_address',
      content: 'Cairo, Egypt',
    },
    {
      property: 'business:contact_data:locality',
      content: 'Cairo',
    },
    {
      property: 'business:contact_data:region',
      content: 'Cairo Governorate',
    },
    {
      property: 'business:contact_data:country_name',
      content: 'Egypt',
    },
    {
      name: 'geo.region',
      content: 'EG-C',
    },
    {
      name: 'geo.placename',
      content: 'Cairo',
    },
    {
      name: 'geo.position',
      content: '30.0444;31.2357',
    },
    {
      name: 'ICBM',
      content: '30.0444, 31.2357',
    },
  ],
  
  robotsProps: {
    nosnippet: false,
    notranslate: false,
    noimageindex: false,
    noarchive: false,
    maxSnippet: -1,
    maxImagePreview: 'large',
    maxVideoPreview: -1,
  },
};

export const BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  name: 'Dorety Bakery',
  image: 'https://doretybakery.com/og-image.jpg',
  '@id': 'https://doretybakery.com',
  url: 'https://doretybakery.com',
  telephone: '+20-XXX-XXXX',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Cairo',
    addressLocality: 'Cairo',
    addressRegion: 'Cairo Governorate',
    addressCountry: 'EG',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 30.0444,
    longitude: 31.2357,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  servesCuisine: 'Bakery',
  priceRange: '$$',
  sameAs: [
    'https://www.facebook.com/doretybakery',
    'https://www.instagram.com/doretybakery',
    'https://twitter.com/doretybakery',
  ],
};