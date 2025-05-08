import { redirect } from "next/navigation";
import { auth } from "./auth";

export default async function Homepage() {
  const session = await auth();
  
  // Redirect to dashboard if logged in, otherwise to login page
  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
  
  // This won't actually render, but included just in case
  return (
    <div>Redirecting...</div>
  );
}