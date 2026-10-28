import { describe, expect, it } from "vitest";
import { dayColumn, longDayLabel, shortDayLabel, studyDayPrompt, studyDayTitle, visibleStudyDays } from "./study-day";

describe("Georgian day labels", () => {
  it("short, long and the phone column", () => {
    expect(shortDayLabel("2026-10-29")).toBe("ხუთ, 29 ოქტ.");
    expect(longDayLabel("2026-10-30")).toBe("პარასკევი, 30 ოქტომბერი");
    expect(shortDayLabel("2026-11-01")).toBe("კვი, 1 ნოე.");
    expect(dayColumn("2026-10-26")).toEqual({ weekday: "ორშ", day: 26 });
  });
});

describe("study day text", () => {
  const day = { topics: ["ელასტიურობა", " ბაზრები "], tasks: ["თავი 4", "5 ამოცანა", " "] };

  it("joins the topics into a title", () => {
    expect(studyDayTitle(day)).toBe("ელასტიურობა, ბაზრები");
  });

  it("builds the AI teacher's first message, with subtopics only when there are some", () => {
    expect(studyDayPrompt("მიკროეკონომიკა", day)).toBe(
      "დღეს ვსწავლობ „მიკროეკონომიკა“-ს. დღის თემა: ელასტიურობა, ბაზრები.\nქვეთემები: თავი 4; 5 ამოცანა\nამიხსენი ეს თემა მარტივად, ნაბიჯ ნაბიჯ, მაგალითებით. ბოლოს 3 მოკლე კითხვით შემამოწმე.",
    );
    expect(studyDayPrompt("ფიზიკა", { topics: ["ძალა"], tasks: [] }).split("\n")).toHaveLength(2);
  });
});

describe("visibleStudyDays", () => {
  it("shows the first few unless everything was asked for", () => {
    const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(visibleStudyDays(days, false, 8)).toHaveLength(8);
    expect(visibleStudyDays(days, true, 8)).toHaveLength(10);
    expect(visibleStudyDays(days, false, 4)).toEqual([1, 2, 3, 4]);
  });
});
