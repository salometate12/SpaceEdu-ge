import type { ComponentType } from "react";
import type { CvTemplateId } from "@/lib/cv-data";
import { AtsTemplate } from "./AtsTemplate";
import { ClassicTemplate } from "./ClassicTemplate";
import { ExecutiveTemplate } from "./ExecutiveTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { ModernTemplate } from "./ModernTemplate";
import type { CvTemplateProps } from "./parts";

export const CV_TEMPLATE_COMPONENTS: Record<CvTemplateId, ComponentType<CvTemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  executive: ExecutiveTemplate,
  minimal: MinimalTemplate,
  ats: AtsTemplate,
};

export type { CvTemplateProps } from "./parts";
