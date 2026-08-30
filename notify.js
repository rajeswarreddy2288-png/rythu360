import { supabase } from "./supabase";

export async function notify(userId, title, body) {
  if (!userId) return;
  await supabase.from("notifications").insert([{ user_id: userId, title, body }]);
}
