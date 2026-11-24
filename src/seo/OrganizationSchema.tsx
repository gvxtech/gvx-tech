import { Helmet } from 'react-helmet-async';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GVX TECH',
  url: 'https://gvxtech.com/',
  logo: 'https://gvxtech.com/GVX-logo.png',
  description:
    'GVX TECH provides web development, software development, mobile applications and digital solutions.',
};

export default function OrganizationSchema() {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
}