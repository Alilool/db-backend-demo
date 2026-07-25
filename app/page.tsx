import { DatabasePlayground } from "./database-playground";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <DatabasePlayground
      signOutAction={signOutAction}
      userEmail={session.user.email ?? "Signed in"}
    />
  );
}
