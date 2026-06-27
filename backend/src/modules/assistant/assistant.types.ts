export interface AssistantCompanyInfo {
  name: string;
  website: string;
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  facebook: string;
  instagram: string;
  address: string;
  hours: string;
  servicesPageUrl: string;
  portfolioPageUrl: string;
  orderPageUrl: string;
}

export interface AssistantServiceInfo {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  orderUrl: string;
}

export interface AssistantPortfolioItem {
  title: string;
  category: string;
  url: string;
}

export interface AssistantFaqItem {
  q: string;
  a: string;
}

export interface AssistantKnowledge {
  company: AssistantCompanyInfo;
  services: AssistantServiceInfo[];
  portfolio: AssistantPortfolioItem[];
  orderWorkflow: string[];
  faq: AssistantFaqItem[];
  priceHints: string[];
}
