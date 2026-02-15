import Layout from '@theme/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

import styles from './index.module.css'

export default function Home() {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Documentation Maison Amane</h1>
          <p className={styles.subtitle}>
            Documentation technique et fonctionnelle de la plateforme e-commerce
          </p>
          <div className={styles.buttons}>
            <a className={styles.button} href="/docs/intro">
              Commencer
            </a>
            <a className={styles.buttonSecondary} href="/docs/architecture/overview">
              Vue d'ensemble
            </a>
          </div>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>Architecture</h3>
            <p>DDD, CQRS et Event Sourcing avec Effect-TS</p>
            <a href="/docs/architecture/overview">En savoir plus →</a>
          </div>
          <div className={styles.feature}>
            <h3>Flux de données</h3>
            <p>Transformations Pilot → Catalog et synchronisation Shopify</p>
            <a href="/docs/architecture/data-flows/pilot-to-catalog">Explorer →</a>
          </div>
          <div className={styles.feature}>
            <h3>Glossaire</h3>
            <p>Ubiquitous Language et concepts métier</p>
            <a href="/docs/architecture/glossary">Consulter →</a>
          </div>
        </div>
      </main>
    </Layout>
  )
}
