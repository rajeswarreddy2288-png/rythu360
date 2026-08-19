import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nrzjyhlrwasestaylmwc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_61M7xmEtTxqg2tk3TAoEXA_EhGjelOt";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
