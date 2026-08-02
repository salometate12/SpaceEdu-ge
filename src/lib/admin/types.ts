export type AdminSectionId = "calculator" | "quiz" | "settings";

export interface AdminQuizQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface AdminQuizMaterial {
  id: string;
  title: string;
  subject: string;
  materialPreview: string;
  questionCount: number;
  questions: AdminQuizQuestion[];
  updatedAt: string;
}

export interface AdminQuizStore {
  meta: {
    updatedAt: string;
    count: number;
  };
  items: AdminQuizMaterial[];
}

export interface AdminAiSettings {
  googleGenerativeAiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  providerOrder: string;
  geminiModel: string;
  openaiModel: string;
  anthropicModel: string;
}

export interface AdminSettings {
  meta: {
    updatedAt: string;
  };
  siteName: string;
  siteTagline: string;
  maintenanceMode: boolean;
  supportEmail: string;
  ai: AdminAiSettings;
}

export interface AdminStoreMeta {
  store: string;
  updatedAt: string;
  count?: number;
}
