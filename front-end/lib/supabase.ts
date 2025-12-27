import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  updated_at: string;
};

export type Permission = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type UserPermission = {
  id: string;
  user_id: string;
  permission_id: string;
  granted_at: string;
  granted_by: string | null;
};

export type UserWithPermissions = Profile & {
  permissions: Permission[];
};
