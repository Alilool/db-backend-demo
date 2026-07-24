"use client";

import { FormEvent, useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

type ApiError = { error?: string };

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function DatabasePlayground() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/tasks", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as Task[] | ApiError;
        console.log("Fetched tasks:", body);
        if (!response.ok) {
          throw new Error(
            "error" in body ? body.error : "Could not load tasks.",
          );
        }
        return body as Task[];
      })
      .then((savedTasks) => {
        console.log("Saved tasks:", savedTasks);
        if (active) setTasks(savedTasks);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not connect to the API.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setSaving(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle }),
      });
      const body = (await response.json()) as Task | ApiError;
      if (!response.ok) {
        throw new Error(
          "error" in body ? body.error : "Could not create task.",
        );
      }
      setTasks((current) => [body as Task, ...current]);
      setTitle("");
      setError("");
      setToast("INSERT completed — row saved in PostgreSQL.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create task.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    setPendingId(task.id);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const body = (await response.json()) as Task | ApiError;
      console.log("PATCH response body:", body);
      if (!response.ok) {
        throw new Error(
          "error" in body ? body.error : "Could not update task.",
        );
      }
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? (body as Task) : item)),
      );
      setToast("UPDATE completed — refresh and this state will remain.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update task.",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function deleteTask(task: Task) {
    setPendingId(task.id);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { ok?: boolean } | ApiError;
      if (!response.ok) {
        throw new Error(
          "error" in body ? body.error : "Could not delete task.",
        );
      }
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setToast("DELETE completed — the row is gone.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete task.",
      );
    } finally {
      setPendingId(null);
    }
  }

  const connected = !loading && !error;

  return (
    <main className="page-shell">
      <nav className="topbar" aria-label="Project header">
        <div className="brand">
          <span className="brand-mark">DB</span>
          Local Postgres Lab
        </div>
        <span className="local-pill">Runs on your machine</span>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Next.js backend playground</p>
          <h1>
            Make data <span className="accent">stick.</span>
          </h1>
        </div>
        <p className="hero-copy">
          Add, complete, and delete real records. Every action travels through a
          Next.js API route and lands in your local PostgreSQL database.
        </p>
      </section>

      <section className="workspace" aria-label="Database playground">
        <div className="card task-card">
          <div className="card-heading">
            <h2>Persistent tasks</h2>
            <span
              className={`status-pill ${error ? "error" : connected ? "connected" : ""}`}
            >
              {loading
                ? "Checking database"
                : error
                  ? "Needs setup"
                  : "PostgreSQL connected"}
            </span>
          </div>

          <form className="create-form" onSubmit={createTask}>
            <input
              aria-label="Task title"
              maxLength={160}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Try: Learn parameterized queries"
              value={title}
            />
            <button
              className="primary-button"
              disabled={saving || !title.trim()}
              type="submit"
            >
              {saving ? "Saving…" : "Insert row"}
            </button>
          </form>

          {error ? (
            <div className="error-panel">
              <div>
                <strong>PostgreSQL is not connected yet.</strong>
                {error}
                <br />
                <code>copy .env.example .env.local</code>
              </div>
            </div>
          ) : loading ? (
            <div className="empty-state">
              <div>
                <strong>Running SELECT…</strong>
                Asking the API for your saved rows.
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div>
                <strong>Your table is empty.</strong>
                Insert the first row above, then refresh the page.
              </div>
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li className="task-row" key={task.id}>
                  <button
                    aria-label={
                      task.completed
                        ? `Mark ${task.title} incomplete`
                        : `Mark ${task.title} complete`
                    }
                    className={`check-button ${task.completed ? "checked" : ""}`}
                    disabled={pendingId === task.id}
                    onClick={() => void toggleTask(task)}
                    type="button"
                  >
                    ✓
                  </button>
                  <div>
                    <p className={`task-title ${task.completed ? "done" : ""}`}>
                      {task.title}
                    </p>
                    <span className="task-time">
                      row #{task.id} · {formatTime(task.createdAt)}
                    </span>
                  </div>
                  <button
                    aria-label={`Delete ${task.title}`}
                    className="icon-button"
                    disabled={pendingId === task.id}
                    onClick={() => void deleteTask(task)}
                    title="Delete row"
                    type="button"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="side-column">
          <div className="card flow-card">
            <h2>Follow the request</h2>
            <ol className="flow-list">
              <li className="flow-step">
                <span className="step-number">01</span>
                <span>
                  <strong>Browser event</strong>
                  React calls fetch when you click.
                </span>
              </li>
              <li className="flow-step">
                <span className="step-number">02</span>
                <span>
                  <strong>Next.js route</strong>
                  The server validates the request.
                </span>
              </li>
              <li className="flow-step">
                <span className="step-number">03</span>
                <span>
                  <strong>SQL query</strong>A parameterized query reaches
                  PostgreSQL.
                </span>
              </li>
              <li className="flow-step">
                <span className="step-number">04</span>
                <span>
                  <strong>JSON response</strong>
                  The saved row returns to the UI.
                </span>
              </li>
            </ol>
          </div>

          <div className="query-card">
            <div className="query-label">What the API runs</div>
            <pre>{`INSERT INTO demo_tasks (title)
VALUES ($1)
RETURNING *;`}</pre>
          </div>
        </aside>
      </section>

      {toast ? (
        <div aria-live="polite" className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
