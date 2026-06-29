import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'BookReview — The Digital Scriptorium'
const SITE_URL = 'https://book-review-six-rho.vercel.app'
const DEFAULT_IMAGE = `${SITE_URL}/Book-review.webp`
const DEFAULT_DESCRIPTION = 'The Digital Scriptorium: descubrí, calificá y discutí libros con una comunidad de lectores. Reseñas, catálogo, favoritos y un asistente de IA para tu próxima lectura.'

/**
 * Hook de SEO dinámico. Actualiza el <head> del documento con:
 * - <title>
 * - meta description
 * - Open Graph (og:*)
 * - Twitter Card (twitter:*)
 * - canonical URL
 * - JSON-LD Schema.org
 * - robots (noindex opcional)
 *
 * @param {Object} options
 * @param {string} [options.title]
 * @param {string} [options.description]
 * @param {string} [options.image]
 * @param {'website'|'article'|'book'} [options.type]
 * @param {Object|null} [options.jsonLd]
 * @param {boolean} [options.noindex]
 */
export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd = null,
  noindex = false,
} = {}) {
  const location = useLocation()
  const canonicalUrl = `${SITE_URL}${location.pathname}`
  const fullTitle = title ? `${title} | BookReview` : SITE_NAME

  useEffect(() => {
    // --- Title ---
    document.title = fullTitle

    // Helper: upsert a <meta> tag
    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const [attrName, attrVal] = selector
          .replace(/\[|\]/g, '')
          .split('=')
          .map(s => s.replace(/"/g, ''))
        el.setAttribute(attrName, attrVal)
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }

    // Helper: upsert a <link> tag
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`)
      if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
      }
      el.setAttribute('href', href)
    }

    // --- Description ---
    setMeta('meta[name="description"]', 'content', description)

    // --- Robots ---
    setMeta('meta[name="robots"]', 'content', noindex ? 'noindex, nofollow' : 'index, follow')

    // --- Canonical ---
    setLink('canonical', canonicalUrl)

    // --- Open Graph ---
    setMeta('meta[property="og:title"]', 'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:image"]', 'content', image)
    setMeta('meta[property="og:url"]', 'content', canonicalUrl)
    setMeta('meta[property="og:type"]', 'content', type)
    setMeta('meta[property="og:site_name"]', 'content', 'BookReview')
    setMeta('meta[property="og:locale"]', 'content', 'es_AR')

    // --- Twitter Card ---
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'content', fullTitle)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', image)

    // --- JSON-LD ---
    const existingScript = document.querySelector('script[data-seo="true"]')
    if (jsonLd) {
      const script = existingScript || document.createElement('script')
      script.setAttribute('type', 'application/ld+json')
      script.setAttribute('data-seo', 'true')
      script.textContent = JSON.stringify(jsonLd)
      if (!existingScript) document.head.appendChild(script)
    } else if (existingScript) {
      existingScript.remove()
    }
  }, [fullTitle, description, image, type, canonicalUrl, noindex, jsonLd])
}
