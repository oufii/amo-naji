import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frkwtttfnexrnjbrerfv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_eTxPaapDLCaH3zeehCCzfQ_FGRiZJzx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
