import { createClient } from "@supabase/supabase-js";
import { VITE_SUPABASE_KEY } from "../appConfig";

const supabaseUrl = "https://bcyuhekxrakrbryeblgu.supabase.co";
const supabaseKey = VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
