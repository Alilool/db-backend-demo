import { getPrisma } from "@/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function databaseError() {
  return NextResponse.json(
    {
      error:
        "Could not reach local PostgreSQL. Check that it is running and that DATABASE_URL is correct.",
    },
    { status: 503 },
  );
}

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const id = parseId((await context.params).id);
    if (!id) {
      return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
    }

    const body = (await request.json()) as { completed?: unknown };
    if (typeof body.completed !== "boolean") {
      return NextResponse.json(
        { error: "completed must be true or false." },
        { status: 400 },
      );
    }

    const task = await getPrisma().task.update({
      where: { id },
      data: { completed: body.completed },
    });

    return NextResponse.json(task);
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    console.error("PATCH /api/tasks/:id failed", error);
    return databaseError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const id = parseId((await context.params).id);
    if (!id) {
      return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
    }

    await getPrisma().task.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    console.error("DELETE /api/tasks/:id failed", error);
    return databaseError();
  }
}
