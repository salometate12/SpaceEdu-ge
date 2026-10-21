import { describe, expect, it } from "vitest";
import {
  accentColor,
  defaultCvTemplate,
  normalizeCvTemplate,
  showsPhoto,
  splitList,
  visibleSections,
  type CvData,
} from "./cv-data";

const data = (extra: Partial<CvData> = {}): CvData => ({
  fullName: "ნინო ბერიძე",
  headline: "",
  email: "",
  phone: "",
  photo: null,
  summary: "",
  experience: [],
  experienceText: "",
  education: [],
  skills: [],
  softSkills: [],
  languages: [],
  links: [],
  ...extra,
});

describe("normalizeCvTemplate", () => {
  it("maps the old templates to the new ones", () => {
    expect(normalizeCvTemplate("minimal-tech")).toBe("modern");
    expect(normalizeCvTemplate("creative-ui")).toBe("minimal");
    expect(normalizeCvTemplate("academic-corporate")).toBe("classic");
  });

  it("keeps new ids and falls back to Modern", () => {
    expect(normalizeCvTemplate("executive")).toBe("executive");
    expect(normalizeCvTemplate("ats")).toBe("ats");
    expect(normalizeCvTemplate("nope")).toBe("modern");
    expect(normalizeCvTemplate(undefined)).toBe("modern");
  });
});

describe("visibleSections", () => {
  it("hides empty sections and keeps the standard order", () => {
    expect(visibleSections(data())).toEqual([]);
    expect(
      visibleSections(
        data({ links: ["linkedin.com/in/nino"], summary: "ტექსტი", skills: ["React"], education: [{ institution: "თსუ", degree: "", year: "" }] }),
      ),
    ).toEqual(["summary", "education", "skills", "links"]);
  });

  it("counts raw experience text before generation, and ignores blank items", () => {
    expect(visibleSections(data({ experienceText: "სტაჟირება" }))).toEqual(["experience"]);
    expect(visibleSections(data({ experience: [" "], languages: [""] }))).toEqual([]);
  });
});

describe("showsPhoto", () => {
  it("never shows the photo on the ATS template", () => {
    const withPhoto = data({ photo: "data:image/jpeg;base64,x" });
    expect(showsPhoto("ats", { showPhoto: true }, withPhoto)).toBe(false);
    expect(showsPhoto("modern", { showPhoto: true }, withPhoto)).toBe(true);
    expect(showsPhoto("modern", { showPhoto: false }, withPhoto)).toBe(false);
    expect(showsPhoto("classic", { showPhoto: true }, data())).toBe(false);
  });
});

describe("defaults and helpers", () => {
  it("suggests ATS when the ATS pill is on and nothing was saved", () => {
    expect(defaultCvTemplate(null, true)).toBe("ats");
    expect(defaultCvTemplate(null, false)).toBe("modern");
    expect(defaultCvTemplate("academic-corporate", true)).toBe("classic");
  });

  it("splits skills and resolves accents", () => {
    expect(splitList("კოლაბორაცია, პრობლემების გადაჭრა;\nლიდერობა")).toEqual(["კოლაბორაცია", "პრობლემების გადაჭრა", "ლიდერობა"]);
    expect(accentColor("teal")).toBe("#0f766e");
    expect(accentColor("x")).toBe("#1e3a5f");
  });
});
