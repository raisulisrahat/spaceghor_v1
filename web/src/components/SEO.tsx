import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { resolveImageUrl } from '../utils/image';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string;
  schema?: any; // For JSON-LD structured data
}

const SEO = ({ title, description, image, url, type = 'website', keywords, schema }: SEOProps) => {
  const { siteTitle, settings } = useSettings();

  useEffect(() => {
    // 1. Title Management
    const baseTitle = siteTitle || 'Qbamart';
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    document.title = fullTitle;

    // 2. Meta Tags Helper
    const updateMetaTag = (property: string, content: string, isName = false) => {
      if (!content) return;
      const attribute = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. SEO Data Derivation
    const metaDesc = description || settings?.meta_description || `${baseTitle} - Premium Shopping in Bangladesh`;
    const metaKeywords = keywords || settings?.meta_keywords || `ecommerce, bangladesh, shopping, ${baseTitle}`;
    const canonicalUrl = url || window.location.href;
    const ogImage = image ? resolveImageUrl(image) : (settings?.site_logo ? resolveImageUrl(settings.site_logo) : '');

    // 4. Update Standard Tags
    updateMetaTag('description', metaDesc, true);
    updateMetaTag('keywords', metaKeywords, true);
    updateMetaTag('author', baseTitle, true);
    updateMetaTag('robots', 'index, follow', true);

    // 5. Update Open Graph Tags
    updateMetaTag('og:site_name', baseTitle);
    updateMetaTag('og:title', fullTitle);
    updateMetaTag('og:description', metaDesc);
    updateMetaTag('og:url', canonicalUrl);
    updateMetaTag('og:type', type);
    if (ogImage) {
      updateMetaTag('og:image', ogImage);
      updateMetaTag('og:image:alt', title || baseTitle);
    }

    // 6. Update Twitter Tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', fullTitle, true);
    updateMetaTag('twitter:description', metaDesc, true);
    if (ogImage) updateMetaTag('twitter:image', ogImage, true);

    // 7. Update Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 8. JSON-LD Structured Data
    const existingSchema = document.getElementById('json-ld-schema');
    if (existingSchema) existingSchema.remove();

    if (schema) {
      const script = document.createElement('script');
      script.id = 'json-ld-schema';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schema);
      document.head.appendChild(script);
    } else {
      // Default website schema
      const defaultSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": baseTitle,
        "url": window.location.origin,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${window.location.origin}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      };
      const script = document.createElement('script');
      script.id = 'json-ld-schema';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(defaultSchema);
      document.head.appendChild(script);
    }

  }, [title, description, image, url, type, keywords, siteTitle, settings, schema]);

  return null;
};

export default SEO;
