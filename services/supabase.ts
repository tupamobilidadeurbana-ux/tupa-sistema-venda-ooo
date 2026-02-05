
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gafcemltoerrrieaggqj.supabase.co';
const supabaseKey = 'sb_publishable_QCb9fCM_opZiRso8Hrk-RA_mJkNZ-Tn';

export const supabase = createClient(supabaseUrl, supabaseKey);
