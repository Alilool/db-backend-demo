import { ensureSchema, getPool } from "@/db";
import { NextResponse } from "next/server";
import { toTask, type TaskRow } from "@/app/api/tasks/route";

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

export async function PATCH(request: Request, context: RouteContext) {
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

    await ensureSchema();
    const result = await getPool().query<TaskRow>(
      `UPDATE demo_tasks
       SET completed = $1
       WHERE id = $2
       RETURNING id, title, completed, created_at`,
      [body.completed, id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json(toTask(result.rows[0]));
  } catch (error) {
    console.error("PATCH /api/tasks/:id failed", error);
    return databaseError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = parseId((await context.params).id);
    if (!id) {
      return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
    }

    await ensureSchema();
    const result = await getPool().query(
      "DELETE FROM demo_tasks WHERE id = $1",
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tasks/:id failed", error);
    return databaseError();
  }
}
