import { cookies } from "next/headers";
import { lucia } from "./lucia";
import { redirect } from "next/navigation";
import { validateRequest } from "./validate-request";

export async function createSession(userId: string) {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  
  return session;
}

export async function deleteSession() {
  const { session } = await validateRequest();
  
  if (!session) {
    return;
  }
  
  await lucia.invalidateSession(session.id);
  
  const sessionCookie = lucia.createBlankSessionCookie();
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
}

export async function requireAuth() {
  const { user } = await validateRequest();
  
  if (!user) {
    redirect("/login");
  }
  
  return user;
}
