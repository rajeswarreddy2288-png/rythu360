import { supabase } from "./supabase";

// Creates an in-app notification for a specific user. Call this anywhere in
// the app when something happens that the user should know about (order
// status change, seller approval, etc).
export async function notify(userId, title, body) {
  if (!userId) return;
  await supabase.from("notifications").insert([{ user_id: userId, title, body }]);
}