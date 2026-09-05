import type { AiPageType } from "./page-types";
import { studyPlanDaysToGenerate } from "./study-plan-days";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function buildUserPrompt(
  pageType: AiPageType,
  payload: Record<string, unknown>,
): string {
  switch (pageType) {
    case "quiz": {
      const topic = asString(payload.topic);
      const textBody = asString(payload.textBody);
      const source = textBody || topic;
      return `Generate an active recall examination from this material:\n\n${source}`;
    }

    case "research-platform-abit": {
      const toggles = payload.toggles as Record<string, boolean> | undefined;
      const focus: string[] = ["რეზიუმე", "წყაროები", "ციტატები"];
      if (toggles?.theses) focus.push("ძირითადი თეზისები");
      if (toggles?.methodology) focus.push("მეთოდოლოგია");
      if (toggles?.literature) focus.push("ლიტერატურის მიმოხილვა");
      if (toggles?.criticalAnalysis) focus.push("კრიტიკული ანალიზი (ძლიერი/სუსტი მხარეები)");
      if (toggles?.conclusions) focus.push("დასკვნები და რეკომენდაციები");
      return [
        payload.fileName ? `დოკუმენტი: ${asString(payload.fileName)}` : "",
        "შიგთავსი: უკვე ამოღებული ტექსტი (არა ბინარული ნაკადი).",
        "--- BEGIN DOCUMENT TEXT ---",
        asString(payload.textBody),
        "--- END DOCUMENT TEXT ---",
        `ანალიზის ფოკუსი: ${focus.join("; ")}`,
        "დააბრუნე მხოლოდ JSON კონტრაქტის მიხედვით — ყველა ტექსტი ქართულად.",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    case "study-plan": {
      const examDate = asString(payload.examDate);
      const planDays = studyPlanDaysToGenerate(examDate);
      return [
        `საგანი: ${asString(payload.subject)}`,
        `თემები: ${asString(payload.topics)}`,
        `გამოცდის თარიღი: ${examDate}`,
        `დღეში სასწავლო დრო (საათი): ${asNumber(payload.hoursPerDay, 2)}`,
        `მომზადების დონე: ${asString(payload.preparationLevel, "საშუალო")}`,
        `დღევანდელ თარიღი: ${new Date().toISOString().slice(0, 10)}`,
        `გეგმაში ზუსტად ${planDays} დღე უნდა იყოს (არა მეტი).`,
        "თითოეულ დღეს მიუთითე date (YYYY-MM-DD), day_name, topics, hours, tasks, focus_level.",
      ].join("\n");
    }

    case "ai-teacher": {
      const subject = asString(payload.subject);
      const material = asString(payload.material);
      const message = asString(payload.message);
      return [
        material ? `Reference material:\n${material}` : "",
        subject
          ? `Student question (${subject}): ${message}`
          : `Student question: ${message}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    case "presentation": {
      const qa = payload.qa as Record<string, string> | undefined;
      return [
        `თემა: ${asString(payload.topic)}`,
        `საგანი/სფერო: ${asString(payload.subject)}`,
        `სლაიდების რაოდენობა: ${asNumber(payload.slideCount, 10)}`,
        `აუდიტორიის დონე: ${asString(payload.level, "უნივერსიტეტი")}`,
        `ენა: ${asString(payload.language, "ქართული")}`,
        qa?.goal ? `მიზანი: ${asString(qa.goal)}` : "",
        qa?.audience ? `აუდიტორია: ${asString(qa.audience)}` : "",
        qa?.tone ? `ტონი: ${asString(qa.tone)}` : "",
        qa?.mainPoint ? `მთავარი იდეა: ${asString(qa.mainPoint)}` : "",
        asString(payload.extraInstructions)
          ? `დამატებითი ინსტრუქცია: ${asString(payload.extraInstructions)}`
          : "",
        payload.templateId ? `ტემპლეიტი: ${asString(payload.templateId)}` : "",
        "შექმენი სრული სლაიდ-დეკი JSON კონტრაქტის მიხედვით — ყველა ტექსტი ქართულად.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    case "lecture-notes": {
      const mode = asString(payload.mode, "chat");
      const title = asString(payload.title, "ლექციის ნოტი");
      const content = asString(payload.content);
      const keyword = asString(payload.keyword);
      if (mode === "keywords") {
        return [
          `ლექციის სათაური: ${title}`,
          "ამოიღე 3-8 მოკლე საკვანძო თემა/ტერმინი ამ ნოტიდან.",
          "დააბრუნე მხოლოდ JSON { \"keywords\": [\"...\"] } — უპირატესობა ტექნიკურ ტერმინებს და ქართულ თემებს.",
          "არ დაამატო # პრეფიქსი.",
          "--- BEGIN NOTE ---",
          content || "(ცარიელი ნოტი)",
          "--- END NOTE ---",
        ].join("\n");
      }
      return [
        `ლექციის სათაური: ${title}`,
        keyword ? `ფოკუსი საკვანძო თემაზე: ${keyword}` : "",
        "--- BEGIN LECTURE NOTE ---",
        content || "(ნოტი ჯერ ცარიელია — უპასუხე ზოგადად, მაგრამ თქვი რომ კონტექსტი ცოტაა.)",
        "--- END LECTURE NOTE ---",
        `სტუდენტის კითხვა: ${asString(payload.message)}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    case "eli5": {
      const level = asString(payload.level, "kid");
      const levelHint =
        level === "kid"
          ? "როგორც 5 წლის ბავშვს"
          : level === "school"
            ? "სკოლის მოსწავლისთვის"
            : "უნივერსიტეტის პირველკურსელისთვის";
      return [
        `კონცეფცია: ${asString(payload.query)}`,
        `სიმარტივის დონე: ${levelHint}`,
        asString(payload.context) ? `კონტექსტი: ${asString(payload.context)}` : "",
        "გამოიყენე მეტაფორა, მოკლე წინადადებები და პოზიტიური ტონი.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    case "cv": {
      const profile = (payload.profile ?? payload) as Record<string, unknown>;
      const pills = profile.optimizationPills as
        | { ats?: boolean; internship?: boolean }
        | undefined;
      const focus: string[] = [];
      if (pills?.ats) focus.push("ATS-თან თავსებადი ფორმულირებები");
      if (pills?.internship) focus.push("სტაჟირების/Junior როლისთვის მორგება");
      return [
        "გააუმჯობესე სტუდენტის CV პროფილი ქართულად.",
        `სახელი: ${asString(profile.fullName)}`,
        `კონტაქტი: ${asString(profile.email)} | ${asString(profile.phone)}`,
        profile.portfolio ? `პორტფოლიო: ${asString(profile.portfolio)}` : "",
        `განათლება: ${asString(profile.university)} — ${asString(profile.degree)} (${asString(profile.graduationYear)})`,
        `გამოცდილება (ნედლი ტექსტი):\n${asString(profile.experienceText)}`,
        `ინსტრუმენტები: ${Array.isArray(profile.tools) ? profile.tools.join(", ") : ""}`,
        `რბილი უნარები: ${asString(profile.softSkills)}`,
        `ტემპლეიტის სტილი: ${asString(profile.template, "minimal-tech")}`,
        focus.length ? `ოპტიმიზაციის ფოკუსი: ${focus.join("; ")}` : "",
        "დააბრუნე მხოლოდ JSON კონტრაქტის მიხედვით — ყველა ტექსტი ქართულად.",
      ]
        .filter(Boolean)
        .join("\n");
    }

    case "syllabus": {
      const options = payload.options as Record<string, boolean> | undefined;
      const enabled: string[] = [];
      if (options?.plan) enabled.push("სემესტრული გეგმა და დედლაინები");
      if (options?.midterms) enabled.push("შუალედური გამოცდები");
      if (options?.["quiz-weeks"]) enabled.push("Quiz კვირები");
      return [
        payload.fileName ? `სილაბუსის ფაილი: ${asString(payload.fileName)}` : "",
        payload.semesterStartDate
          ? `სემესტრის დაწყების თარიღი: ${asString(payload.semesterStartDate)} (გამოიყენე ეს კვირის ნომრების რეალურ თარიღებად გადასაყვანად).`
          : "",
        "შიგთავსი: უკვე ამოღებული ტექსტი PDF-დან (არა ბინარული ნაკადი).",
        "--- BEGIN SYLLABUS TEXT ---",
        asString(payload.textBody),
        "--- END SYLLABUS TEXT ---",
        enabled.length
          ? `ანალიზის ფოკუსი: ${enabled.join("; ")}`
          : "ანალიზის ფოკუსი: სრული სემესტრული კალენდარი",
        "ამოიღე მხოლოდ იმ თარიღები და მოვლენები, რომლებიც ტექსტში ნამდვილად ჩანს.",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    default:
      return JSON.stringify(payload);
  }
}
