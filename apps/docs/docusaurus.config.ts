import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'
import { themes as prismThemes } from 'prism-react-renderer'

const config: Config = {
  title: 'Maison Amane',
  tagline: 'Documentation technique et fonctionnelle',
  favicon: 'img/favicon.ico',
  url: 'https://docs.maison-amane.com',
  baseUrl: '/',
  organizationName: 'maison-amane',
  projectName: 'docs',
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr'],
  },
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/maison-amane/maison-amane/tree/main/apps/docs/',
          remarkPlugins: [],
          rehypePlugins: [],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Maison Amane',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/maison-amane/maison-amane',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture/overview',
            },
          ],
        },
        {
          title: 'Ressources',
          items: [
            {
              label: 'Glossaire',
              to: '/docs/architecture/glossary',
            },
            {
              label: 'Flux de donnees',
              to: '/docs/architecture/data-flows/pilot-to-catalog',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Maison Amane.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'json', 'bash'],
    },
    mermaid: {
      theme: {
        light: 'neutral',
        dark: 'dark',
      },
    },
  } satisfies Preset.ThemeConfig,
}

export default config
