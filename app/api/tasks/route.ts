import { getPrisma } from "@/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("DATABASE_URL")) {
    return error.message;
  }

  return "Could not reach local PostgreSQL. Check that it is running and that DATABASE_URL is correct.";
}

export async function GET() {
  try {
    const tasks = await getPrisma().task.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return NextResponse.json(tasks);
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

    const task = await getPrisma().task.create({
      data: { title },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 503 });
  }
}
