import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      link: { type: 'doc', id: 'architecture/overview' },
      items: [
        'architecture/glossary',
        {
          type: 'category',
          label: 'Flux de données',
          collapsed: false,
          items: [
            'architecture/data-flows/pilot-to-catalog',
            'architecture/data-flows/shopify-sync',
            'architecture/data-flows/media-upload',
            'architecture/data-flows/error-handling',
          ],
        },
        {
          type: 'category',
          label: 'Application Client',
          collapsed: false,
          items: ['architecture/client/overview', 'architecture/client/data-flows'],
        },
      ],
    },
  ],
}

export default sidebars
