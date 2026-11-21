import healthcareImg from '../assets/images/industry_healthcare_1795186902978.jpg';
import hospitalityImg from '../assets/images/industry_hospitality_1795186901890.jpg';
import retailImg from '../assets/images/industry_retail_1795186902614.jpg';
import smbImg from '../assets/images/industry_smb_1795186901394.jpg';

import medflowImg from '../assets/images/project_medflow_portal_1795186901557.jpg';
import nordicRetailImg from '../assets/images/project_nordic_retail_1795186902514.jpg';
import nexusAutomationImg from '../assets/images/project_nexus_automation_1795186902144.jpg';

export interface ServiceItem {
  id: string;
  index: string;
  title: string;
  description: string;
  deliverables: string;
  iconName: 'globe' | 'layers' | 'smartphone' | 'trending' | 'workflow';
}

export interface IndustryItem {
  id: string;
  title: string;
  summary: string;
  capability: string;
  image: string;
  alt: string;
}

export interface ProjectItem {
  id: string;
  client: string;
  category: string;
  year: string;
  title: string;
  description: string;
  impactMetric: string;
  image: string;
  alt: string;
  stack: string[];
  challenge: string;
  solution: string;
  outcomes: { label: string; value: string }[];
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'website-development',
    index: '01',
    title: 'Website Development',
    description: 'Beautiful, high-performance websites.',
    deliverables: 'Editorial architecture · Sub-second edge delivery · Accessibility',
    iconName: 'globe',
  },
  {
    id: 'web-applications',
    index: '02',
    title: 'Web Applications',
    description: 'Intelligent digital platforms for businesses.',
    deliverables: 'Real-time dashboards · Role-based portals · API orchestration',
    iconName: 'layers',
  },
  {
    id: 'mobile-applications',
    index: '03',
    title: 'Mobile Applications',
    description: 'Powerful mobile experiences.',
    deliverables: 'iOS & Android · Gesture-first UI · Offline synchronization',
    iconName: 'smartphone',
  },
  {
    id: 'digital-marketing-seo',
    index: '04',
    title: 'Digital Marketing & SEO',
    description: 'Grow your digital presence.',
    deliverables: 'Technical SEO · Conversion funnels · Search visibility',
    iconName: 'trending',
  },
  {
    id: 'business-automation',
    index: '05',
    title: 'Business Automation',
    description: 'Smart systems that simplify operations.',
    deliverables: 'CRM pipelines · Automated intake · Billing & reporting sync',
    iconName: 'workflow',
  },
];

export const INDUSTRIES: IndustryItem[] = [
  {
    id: 'healthcare',
    title: 'Healthcare & Clinics',
    summary: 'Digital patient intake, unified appointment booking, and calm clinical portals.',
    capability: 'Patient Portals & Scheduling',
    image: healthcareImg,
    alt: 'Minimalist modern medical clinic interior with digital check-in tablet',
  },
  {
    id: 'hospitality',
    title: 'Restaurants & Hospitality',
    summary: 'Seamless table reservations, contactless ordering, and direct guest retention tools.',
    capability: 'Booking & POS Automation',
    image: hospitalityImg,
    alt: 'Modern minimalist boutique hospitality lounge with digital guest tablet',
  },
  {
    id: 'retail',
    title: 'Retail & E-commerce',
    summary: 'Headless storefronts engineered for speed, unified inventory, and effortless checkout.',
    capability: 'Omnichannel Storefronts',
    image: retailImg,
    alt: 'Minimalist flagship retail boutique interior with stone display pedestals',
  },
  {
    id: 'smb',
    title: 'Small & Medium Businesses',
    summary: 'Tailored web platforms, lead engines, and workflow automation built to scale.',
    capability: 'Growth & Operations Systems',
    image: smbImg,
    alt: 'Bright modern technology office with oak desks and glass windows',
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'medflow-clinic-os',
    client: 'Apex Medical Group',
    category: 'Web Application · Healthcare',
    year: '2026',
    title: 'Unified Patient Scheduling & Intake Portal',
    description:
      'Replaced fragmented clinic booking forms with a fast, accessible patient portal integrating real-time practitioner availability and automated pre-visit intake.',
    impactMetric: '-62% intake wait time across 14 clinics',
    image: medflowImg,
    alt: 'Silver aluminum laptop displaying Apex Health patient scheduling portal interface',
    stack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'HL7 Sync'],
    challenge:
      'Patients abandoned multi-page paper and PDF intake workflows, causing 28% front-desk bottlenecks and missed pre-appointment screenings.',
    solution:
      'Designed a calm, single-flow web portal with instant slot locking, mobile insurance capture, and automated EHR synchronization.',
    outcomes: [
      { label: 'Intake Time Reduction', value: '-62%' },
      { label: 'Online Booking Adoption', value: '89%' },
      { label: 'Lighthouse Performance', value: '99 / 100' },
    ],
  },
  {
    id: 'aura-headless-commerce',
    client: 'Aura Living Atelier',
    category: 'Website Development · Retail',
    year: '2026',
    title: 'Architectural Headless Commerce Storefront',
    description:
      'Engineered an ultra-lightweight storefront with spatial product previews, instant search filtering, and one-tap multi-currency checkout.',
    impactMetric: '+148% mobile conversion in 90 days',
    image: nordicRetailImg,
    alt: 'Studio monitor on stone desk showing minimalist Aura Living e-commerce storefront',
    stack: ['React', 'Edge CDN', 'Stripe API', 'Tailwind CSS', 'Three.js'],
    challenge:
      'Legacy storefront templates suffered 4.2-second mobile load times, inflating bounce rates on high-intent paid search traffic.',
    solution:
      'Rebuilt the storefront architecture on edge-cached static routes with progressive media hydration and sub-200ms cart transitions.',
    outcomes: [
      { label: 'Mobile Conversion Lift', value: '+148%' },
      { label: 'First Contentful Paint', value: '0.4s' },
      { label: 'Organic Search Traffic', value: '+210%' },
    ],
  },
  {
    id: 'nexus-ops-automation',
    client: 'Verve Logistics Partners',
    category: 'Business Automation · Enterprise',
    year: '2025',
    title: 'Automated Operations & Pipeline Telemetry',
    description:
      'Built an internal command platform unifying client onboarding, automated invoice reconciliation, and live operational workflow tracking.',
    impactMetric: '18 hrs/week saved per operations manager',
    image: nexusAutomationImg,
    alt: 'Laptop and tablet displaying minimalist operations analytics and workflow dashboard',
    stack: ['TypeScript', 'Next-Gen API', 'Webhooks', 'Automated Queues', 'SSO'],
    challenge:
      'Operations teams manually reconciled spreadsheets across billing, dispatch, and CRM systems every evening.',
    solution:
      'Implemented event-driven automation pipelines with exception alerts, audit logs, and a clean executive reporting workspace.',
    outcomes: [
      { label: 'Manual Work Eliminated', value: '18 hrs/wk' },
      { label: 'Billing Reconciliation', value: '99.9%' },
      { label: 'Deployment Cadence', value: 'Zero Downtime' },
    ],
  },
];

export const AGENCY_PILLARS = [
  {
    label: 'Architecture',
    detail: 'Modular, type-safe engineering built for long-term maintainability and speed.',
  },
  {
    label: 'Spatial Craft',
    detail: 'Interactive 3D, motion choreography, and tactile interfaces that feel effortless.',
  },
  {
    label: 'Operational Leverage',
    detail: 'Automation systems that eliminate repetitive work and connect every business tool.',
  },
  {
    label: 'Measurable Growth',
    detail: 'Search architecture and conversion clarity grounded in real analytics.',
  },
];
