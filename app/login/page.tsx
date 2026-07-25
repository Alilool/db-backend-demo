import type { Metadata } from "next";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const metadata: Metadata = {
  title: "Sign in | Local Postgres Lab",
  description: "Sign in to access the database playground.",
};

async function authenticate(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid");
    }

    throw error;
  }
}

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) redirect("/");

  const hasError = (await searchParams).error === "invalid";

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-mark">DB</span>
          Local Postgres Lab
        </div>

        <div className="login-heading">
          <p className="eyebrow">Protected workspace</p>
          <h1 id="login-title">Welcome back.</h1>
          <p>Sign in to view and manage the tasks stored in PostgreSQL.</p>
        </div>

        <form action={authenticate} className="login-form">
          <label htmlFor="email">
            Email
            <input
              autoComplete="email"
              id="email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>

          <label htmlFor="password">
            Password
            <input
              autoComplete="current-password"
              id="password"
              maxLength={128}
              minLength={8}
              name="password"
              placeholder="Enter your password"
              required
              type="password"
            />
          </label>

          {hasError ? (
            <p aria-live="polite" className="login-error" role="alert">
              The email or password is incorrect.
            </p>
          ) : null}

          <button className="login-button" type="submit">
            Sign in
          </button>
        </form>

        <p className="login-footnote">
          Passwords are verified securely with bcrypt.
        </p>
      </section>
    </main>
  );
}
