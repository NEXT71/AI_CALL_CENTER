import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SEO = ({
  title = 'QualityPulse - AI-Powered Call Center Quality Assurance',
  description = 'Transform your call center quality assurance with AI-powered transcription, compliance monitoring, and quality scoring. Analyze calls in minutes, not hours.',
  keywords = 'call center QA, quality assurance software, AI transcription, call analysis, compliance monitoring',
  image = 'https://qualitypulse.com/og-image.jpg',
  url = '',
  type = 'website',
  author = 'QualityPulse',
  publishedTime,
  modifiedTime,
  canonical,
  noindex = false,
  structuredData
}) => {
  const siteUrl = 'https://ai-call-center-o7d7.vercel.app';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const canonicalUrl = canonical || fullUrl;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="QualityPulse" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@qualitypulse" />
      <meta name="twitter:creator" content="@qualitypulse" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  author: PropTypes.string,
  publishedTime: PropTypes.string,
  modifiedTime: PropTypes.string,
  canonical: PropTypes.string,
  noindex: PropTypes.bool,
  structuredData: PropTypes.object
};

export default SEO;
