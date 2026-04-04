import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eseroowftsymowvpqgpo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZXJvb3dmdHN5bW93dnBxZ3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDA2MDksImV4cCI6MjA5MDg3NjYwOX0.8Em97z1JyqJpQh39gRM751zxHLNKpQn-nB_3tyo6iec";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
