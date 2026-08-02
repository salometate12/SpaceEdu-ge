import { NextResponse } from "next/server";
import { getPasswordFromRequest, unauthorizedResponse, verifyAdminPassword } from "@/lib/admin/auth";
import { defaultQuizStore } from "@/lib/admin/default-stores";
import { readAdminStore, writeAdminStore, ensureAdminStore } from "@/lib/admin/json-store";
import type { AdminQuizMaterial, AdminQuizStore } from "@/lib/admin/types";

const STORE = "quizzes";

function assertAuthorized(request: Request) {
  const password = getPasswordFromRequest(request);
  if (!verifyAdminPassword(password)) return unauthorizedResponse();
  return null;
}

function loadStore(): AdminQuizStore {
  ensureAdminStore(STORE, defaultQuizStore());
  return readAdminStore(STORE, defaultQuizStore());
}

function persistStore(store: AdminQuizStore): AdminQuizStore {
  const next: AdminQuizStore = {
    ...store,
    meta: {
      updatedAt: new Date().toISOString(),
      count: store.items.length,
    },
  };
  writeAdminStore(STORE, next);
  return next;
}

export async function GET(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;
  return NextResponse.json(loadStore());
}

export async function PUT(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  let body: AdminQuizStore;
  try {
    body = (await request.json()) as AdminQuizStore;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "Missing quiz items" }, { status: 400 });
  }

  const saved = persistStore(body);
  return NextResponse.json({ ok: true, data: saved });
}

export async function POST(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  let item: AdminQuizMaterial;
  try {
    item = (await request.json()) as AdminQuizMaterial;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!item.id?.trim() || !item.title?.trim()) {
    return NextResponse.json({ error: "Quiz id and title are required" }, { status: 400 });
  }

  const store = loadStore();
  if (store.items.some((entry) => entry.id === item.id)) {
    return NextResponse.json({ error: "Quiz id already exists" }, { status: 409 });
  }

  const saved = persistStore({
    ...store,
    items: [...store.items, { ...item, updatedAt: new Date().toISOString() }],
  });

  return NextResponse.json({ ok: true, data: saved, item });
}

export async function PATCH(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  let item: AdminQuizMaterial;
  try {
    item = (await request.json()) as AdminQuizMaterial;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const store = loadStore();
  const index = store.items.findIndex((entry) => entry.id === item.id);
  if (index < 0) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const items = [...store.items];
  items[index] = { ...item, updatedAt: new Date().toISOString() };
  const saved = persistStore({ ...store, items });

  return NextResponse.json({ ok: true, data: saved, item: items[index] });
}

export async function DELETE(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  let id = "";
  try {
    const body = (await request.json()) as { id?: string };
    id = body.id ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!id.trim()) {
    return NextResponse.json({ error: "Missing quiz id" }, { status: 400 });
  }

  const store = loadStore();
  const saved = persistStore({
    ...store,
    items: store.items.filter((entry) => entry.id !== id),
  });

  return NextResponse.json({ ok: true, data: saved });
}
