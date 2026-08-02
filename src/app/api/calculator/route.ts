import { NextResponse } from "next/server";
import {
  filterPrograms,
  pickPrimaryPrediction,
} from "@/lib/exam-calculator/filter-programs";
import { handbookAvailable, loadHandbook } from "@/lib/exam-calculator/load-handbook";
import { normalizeScores } from "@/lib/exam-calculator/subjects";

export async function POST(request: Request) {
  try {
    if (!(await handbookAvailable())) {
      return NextResponse.json(
        {
          error:
            "ცნობარი ვერ მოიძებნა. გაუშვით npm run parse-handbook და დადეთ PDF data/ ფოლდერში.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      scores?: Record<string, number>;
      focusCode?: string;
    };
    const scores = normalizeScores(body.scores ?? {});

    if (!scores.georgian && scores.georgian !== 0) {
      return NextResponse.json(
        { error: "მიუთითეთ ქართული ენის ქულა." },
        { status: 400 },
      );
    }

    const data = await loadHandbook();
    const results = filterPrograms(data, scores);
    const prediction = pickPrimaryPrediction(
      data,
      scores,
      results,
      body.focusCode?.trim(),
    );

    return NextResponse.json({
      count: results.length,
      results,
      prediction,
      meta: {
        source: data.meta.source,
        programCount: data.meta.programCount,
      },
    });
  } catch (err) {
    console.error("[calculator]", err);
    const message =
      err instanceof Error && process.env.NODE_ENV === "development"
        ? err.message
        : "გამოთვლის შეცდომა. სცადეთ თავიდან.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
