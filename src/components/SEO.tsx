import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { settingsDB } from '@/lib/adminData';

interface SEOProps {
  title?: string;
  description?: string;
  type?: 'website' | 'article' | 'profile' | 'video.other';
  image?: string;
  video?: string;
  url?: string;
  publishedTime?: string;
  structuredData?: any;
}

export const SEO = ({
  title,
  description,
  type = 'website',
  image,
  video,
  url = 'https://sujan1919.com.np',
  publishedTime,
  structuredData
}: SEOProps) => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    settingsDB.get().then(s => setSettings(s)).catch(() => {});
  }, []);

  const finalTitle = title || settings?.siteName || 'Sujan Gautam | Senior Software Developer & UI Architect';
  const finalDesc = description || settings?.siteDescription || 'Official portfolio of Sujan Gautam. High-fidelity UI/UX design, scalable backend systems, and cutting-edge web technologies.';
  const finalImage = image || settings?.ogImage || 'https://sujan1919.com.np/assets/logo.png';
  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      
      {/* Canonical Link */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:image" content={finalImage} />
      
      {/* Open Graph Video */}
      {video && <meta property="og:video" content={video} />}
      {video && <meta property="og:video:type" content="video/mp4" />}

      {/* Open Graph Article metadata */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && (
        <meta property="article:author" content="Sujan Gautam" />
      )}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDesc} />
      <meta property="twitter:image" content={finalImage} />

      {/* Structured Data (JSON-LD) for Google Rich Snippets */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
