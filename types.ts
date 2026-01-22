
export enum Difficulty {
  BASIC = 'Basic',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export enum Category {
  WEB_UI = 'Web UI Fundamentals',
  ADVANCED_SELECTORS = 'Advanced Selectors',
  PERFORMANCE = 'Performance Testing',
  ACCESSIBILITY = 'Accessibility Auditing',
  API_TESTING = 'API Testing',
  IFRAME_TESTING = 'Iframe Testing',
  MAINTENANCE = 'Test Maintenance & Debugging',
  CYPRESS_UTILS = 'Cypress Utility Patterns'
}

export enum Framework {
  PLAYWRIGHT = 'Playwright',
  CYPRESS = 'Cypress'
}

export interface ApiSpecification {
  method: string;
  endpoint: string;
  requestBody?: string;
  expectedResponse: string;
}

export interface TraceStep {
  action: string;
  selector?: string;
  label?: string;
  value?: string;
  frameSelector?: string;
  timestamp: number;
  duration: number;
  status: 'passed' | 'failed';
  network?: {
    method: string;
    url: string;
    status: number;
    payload?: any;
    response?: any;
  };
}

export interface Scenario {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  description: string;
  learningObjectives: string[];
  playwrightSnippet: string;
  cypressSnippet: string;
  playwrightStarterCode?: string;
  cypressStarterCode?: string;
  playgroundPath: string;
  supportedFrameworks?: Framework[];
  apiSpecification?: ApiSpecification;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface ValidationResponse {
  isCorrect: boolean;
  feedback: string;
}
