import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/glossary',
        {
          type: 'category',
          label: 'Flux de donnees',
          collapsed: false,
          items: [
            'architecture/data-flows/pilot-to-catalog',
            'architecture/data-flows/shopify-sync',
            'architecture/data-flows/error-handling',
          ],
        },
      ],
    },
  ],
}

export default sidebars
