/**
 * The presentation wizard's starting values, and what a handoff from
 * another tool fills in: every step (info, design, details). A value the
 * wizard doesn't offer falls back to its default.
 */
import {
  DEFAULT_PRESENTATION_LANGUAGE,
  DEFAULT_PRESENTATION_LEVEL,
  normalizePresentationLevel,
  PRESENTATION_LANGUAGES,
  PRESENTATION_QA_OPTIONS,
  PRESENTATION_SLIDE_COUNTS,
} from "./presentation-constants";
import { PRESENTATION_TEMPLATES } from "./presentation-templates";
import { DEFAULT_TEMPLATE_ID } from "./presentation-theme";
import type { PresentationForm, QAAnswers } from "./presentation-types";
import type { PresentationHandoff } from "./tool-handoff";

export const DEFAULT_PRESENTATION_FORM: PresentationForm = {
  topic: "",
  subject: "",
  slideCount: 10,
  level: DEFAULT_PRESENTATION_LEVEL,
  language: DEFAULT_PRESENTATION_LANGUAGE,
  extraInstructions: "",
};

export const DEFAULT_PRESENTATION_QA: QAAnswers = {
  goal: "ცნების განმარტება",
  audience: "პროფესორი",
  tone: "აკადემიური",
  mainPoint: "",
};

const pick = (value: string | undefined, options: readonly string[], fallback: string) =>
  value && options.includes(value) ? value : fallback;

export interface WizardFill {
  form: PresentationForm;
  qa: QAAnswers;
  templateId: string;
}

export function wizardFromHandoff(handed: PresentationHandoff): WizardFill {
  const slideCount = handed.slideCount && (PRESENTATION_SLIDE_COUNTS as readonly number[]).includes(handed.slideCount) ? handed.slideCount : DEFAULT_PRESENTATION_FORM.slideCount;
  return {
    form: {
      ...DEFAULT_PRESENTATION_FORM,
      topic: handed.topic,
      subject: handed.subject ?? "",
      slideCount,
      level: handed.level ? normalizePresentationLevel(handed.level) : DEFAULT_PRESENTATION_FORM.level,
      language: pick(handed.language, PRESENTATION_LANGUAGES.map((language) => language.value), DEFAULT_PRESENTATION_FORM.language),
      extraInstructions: handed.extraInstructions ?? "",
    },
    qa: {
      goal: pick(handed.goal, PRESENTATION_QA_OPTIONS.goal, DEFAULT_PRESENTATION_QA.goal),
      audience: pick(handed.audience, PRESENTATION_QA_OPTIONS.audience, DEFAULT_PRESENTATION_QA.audience),
      tone: pick(handed.tone, PRESENTATION_QA_OPTIONS.tone, DEFAULT_PRESENTATION_QA.tone),
      mainPoint: handed.keyPoint ?? "",
    },
    templateId: handed.theme && PRESENTATION_TEMPLATES.some((template) => template.id === handed.theme) ? handed.theme : DEFAULT_TEMPLATE_ID,
  };
}

/** „დავალებიდან: {სათაური} · {N} სლაიდი · {დიზაინი}“ */
export function autoStartLabel(fill: WizardFill, fromTask: boolean): string {
  const design = PRESENTATION_TEMPLATES.find((template) => template.id === fill.templateId)?.name ?? fill.templateId;
  return `${fromTask ? "დავალებიდან: " : ""}${fill.form.topic} · ${fill.form.slideCount} სლაიდი · ${design}`;
}
