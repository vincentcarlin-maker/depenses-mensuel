import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://xcdyshzyxpngbpceilym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHlzaHp5eHBuZ2JwY2VpbHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDI4NDYsImV4cCI6MjA3NzMxODg0Nn0.woxCgIKTPvEy7s2ePIJIAIflwal8dG5ApTfpyWy9feQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('*');
    if (error) console.error("Error:", error);
    else console.log("Subscriptions:", JSON.stringify(subscriptions, null, 2));
}

run();
