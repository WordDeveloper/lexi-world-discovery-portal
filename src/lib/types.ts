// Core domain types for the Lexi World Discovery Portal.

export type Priority = "Critical" | "High" | "Medium" | "Low";

export type CardKind =
  | "Confirmation"
  | "Clarification"
  | "New requirement"
  | "Confirmation + Clarification";

export type RequirementType =
  | "Business"
  | "Gameplay"
  | "Technical"
  | "Backend"
  | "Database"
  | "UI"
  | "UX"
  | "Infrastructure"
  | "AI"
  | "Security"
  | "DevOps"
  | "QA";

// The full set of supported input renderers.
export type InputType =
  | "short_text"
  | "paragraph"
  | "single_select"
  | "multi_select"
  | "dropdown"
  | "rating"
  | "slider"
  | "number"
  | "currency"
  | "email"
  | "phone"
  | "url"
  | "tags"
  | "date"
  | "toggle";

export type ConfirmChoice = "confirm" | "modify" | "remove";

export interface QuestionOption {
  value: string;
  label: string;
}

// A condition that controls whether a question is visible.
export interface VisibilityRule {
  questionId: string;
  // Show when the referenced answer equals / includes one of these values.
  anyOf: string[];
}

export interface Question {
  id: string;
  number: number;
  section: string;
  category: string;
  requirementType: RequirementType;
  priority: Priority;
  kind: CardKind;
  currentUnderstanding: string;
  // Present only for confirmation-style cards.
  confirmationStatement?: string;
  missingInformation?: string;
  whyWeNeedThis: string;
  impact: string;
  question: string;
  helpText?: string;
  example?: string;
  developerNote: string;
  reference?: string;
  input: InputType;
  options?: QuestionOption[];
  required?: boolean;
  visibleWhen?: VisibilityRule;
}

export interface Section {
  id: string;
  title: string;
  blurb: string;
}

// A single answer value stored per question.
export interface AnswerValue {
  // Confirmation cards store the client's choice.
  confirm?: ConfirmChoice;
  // Free text / modification note / select values, etc.
  value?: string | string[] | number | boolean | null;
  // Client workflow flags.
  flaggedUncertain?: boolean;
  markedForDiscussion?: boolean;
  bookmarked?: boolean;
  updatedAt?: string;
}

export type AnswerMap = Record<string, AnswerValue>;

export interface DraftPayload {
  token: string;
  answers: AnswerMap;
  currentSectionId?: string;
  updatedAt: string;
  version: string;
}

export interface UploadedFileMeta {
  id: string;
  questionId?: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
}
