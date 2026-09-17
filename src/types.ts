export type ModuleKey = "dashboard" | "patients" | "appointments" | "visits" | "prescriptions" | "invoices" | "reports" | "inventory" | "users" | "backup" | "settings";
export type ActionKey = "can_view" | "can_add" | "can_edit" | "can_delete" | "can_print";

export type Permission = {
  module: ModuleKey;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_print: boolean;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  role: string;
  active: boolean;
  created_at: string;
};

export type ClinicSession = { profile: Profile; permissions: Permission[] };
export type ClinicRow = Record<string, string | number | boolean | null> & { id: string };
