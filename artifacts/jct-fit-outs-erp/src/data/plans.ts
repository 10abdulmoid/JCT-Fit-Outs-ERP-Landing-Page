// REPLACE WITH REAL PLANS

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  currency?: string;
  features: string[];
  highlighted?: boolean;
  cta: 'subscribe' | 'contact';
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Specialist contractors & small fit-out teams',
    monthlyPrice: null,
    yearlyPrice: null,
    currency: 'AED',
    features: [
      'Up to 5 Active Projects',
      '3 Role Portals (QS, PM, Admin)',
      'BOQ & Estimating module',
      'Basic Gantt Scheduling',
      'Standard Email Support',
    ],
    highlighted: false,
    cta: 'subscribe',
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Growing fit-out firms & main contractors',
    monthlyPrice: null,
    yearlyPrice: null,
    currency: 'AED',
    features: [
      'Up to 20 Active Projects',
      'All 8 Role Portals',
      'Full Commercial & Variation Flow',
      'CPM Scheduling & Baseline Tracking',
      'QuickBooks & Accounting Integration',
      'Subcontractor RFQ & Award Packs',
      'Priority Phone & Chat Support',
    ],
    highlighted: true,
    cta: 'subscribe',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Large scale interior fit-out enterprises',
    monthlyPrice: null,
    yearlyPrice: null,
    currency: 'AED',
    features: [
      'Unlimited Active Projects',
      'Unlimited User Accounts & Portals',
      'Custom Approval Matrices & SLA',
      'Dedicated ERP Onboarding Manager',
      'Custom API & ERP Integrations',
      '24/7 Dedicated Support',
    ],
    highlighted: false,
    cta: 'contact',
  },
];
