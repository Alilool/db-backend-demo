import { ensureSchema, getPool } from "@/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TaskRow = {
  id: number;
  title: string;
  completed: boolean;
  created_at: Date;
};

export function toTask(row: TaskRow) {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("DATABASE_URL")) {
    return error.message;
  }

  return "Could not reach local PostgreSQL. Check that it is running and that DATABASE_URL is correct.";
}

export async function GET() {
  try {
    await ensureSchema();
    const result = await getPool().query<TaskRow>(
      `SELECT id, title, completed, created_at
       FROM demo_tasks
       ORDER BY created_at DESC, id DESC`,
    );

    return NextResponse.json(result.rows.map(toTask));
  } catch (error) {
    console.error("GET /api/tasks failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: unknown };
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 },
      );
    }

    if (title.length > 160) {
      return NextResponse.json(
        { error: "Title must be 160 characters or fewer." },
        { status: 400 },
      );
    }

    await ensureSchema();
    const result = await getPool().query<TaskRow>(
      `INSERT INTO demo_tasks (title)
       VALUES ($1)
       RETURNING id, title, completed, created_at`,
      [title],
    );

    return NextResponse.json(toTask(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 503 });
  }
}
