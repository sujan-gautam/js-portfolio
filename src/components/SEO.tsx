import { Helmet } from 'react-helmet-async';

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
  title = 'Sujan Gautam | Senior Software Developer & UI Architect',
  description = 'Official portfolio of Sujan Gautam. High-fidelity UI/UX design, scalable backend systems, and cutting-edge web technologies.',
  type = 'website',
  image = 'https://sujan1919.com.np/assets/logo.png',
  video,
  url = 'https://sujan1919.com.np',
  publishedTime,
  structuredData
}: SEOProps) => {
  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical Link */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
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
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

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
