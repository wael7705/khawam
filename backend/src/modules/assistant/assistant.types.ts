export interface AssistantCompanyInfo {
  name: string;
  website: string;
  whatsapp: string;
  whatsappDisplay: string;
  whatsappUrl: string;
  email: string;
  facebook: string;
  instagram: string;
  address: string;
  mapsUrl: string;
  hours: string;
  servicesPageUrl: string;
  portfolioPageUrl: string;
  orderPageUrl: string;
  myOrdersPageUrl: string;
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

/** سيناريوهات تدريبية: سؤال العميل + الرد المثالي */
export interface AssistantTrainingScenario {
  category: string;
  userSays: string;
  idealReply: string;
}

export interface AssistantKnowledge {
  company: AssistantCompanyInfo;
  services: AssistantServiceInfo[];
  portfolio: AssistantPortfolioItem[];
  orderWorkflow: string[];
  faq: AssistantFaqItem[];
  trainingScenarios: AssistantTrainingScenario[];
}
