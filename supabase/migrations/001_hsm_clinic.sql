create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9._-]{3,30}$'),
  full_name text not null,
  role text not null default 'employee',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_permissions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  module text not null,
  can_view boolean not null default false,
  can_add boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_print boolean not null default false,
  unique(user_id, module)
);

create table if not exists public.clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_name text not null default 'عيادتي',
  doctor_name text not null default 'اسم الطبيب',
  doctor_title text not null default 'د.',
  specialty text not null default 'التخصص الطبي',
  service_one text not null default 'أشعة الإيكو على القلب',
  service_two text not null default 'رسم القلب',
  phone text not null default '',
  phone_secondary text not null default '',
  address text not null default '',
  consultation_note text not null default 'رجاء الالتزام بميعاد الاستشارة مع إحضار الروشتة',
  currency text not null default 'ج.م',
  clinic_hours text not null default '',
  prescription_template_url text not null default '/prescription-template-a5.jpg',
  prescription_font_size integer not null default 16,
  prescription_text_color text not null default '#10233b',
  prescription_offset_x_mm numeric(6,2) not null default 0,
  prescription_offset_y_mm numeric(6,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  age integer,
  phone text not null default '',
  gender text not null default 'غير محدد',
  address text not null default '',
  diagnosis text not null default '',
  medical_history text not null default '',
  notes text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  appointment_date date not null,
  appointment_time time,
  visit_type text not null default 'كشف',
  status text not null default 'منتظر',
  notes text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  visit_date date not null,
  visit_type text not null default 'كشف',
  complaint text not null default '',
  diagnosis text not null default '',
  treatment text not null default '',
  paid numeric(12,2) not null default 0,
  due numeric(12,2) not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_age integer,
  prescription_date date not null default current_date,
  diagnosis text not null default '',
  medicines text not null,
  notes text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  invoice_date date not null default current_date,
  service text not null,
  total numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  notes text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  report_date date not null default current_date,
  title text not null,
  report_body text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  quantity integer not null default 0,
  unit text not null default 'قطعة',
  low_stock_threshold integer not null default 5,
  notes text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id),
  username text,
  action text not null,
  module text not null,
  record_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_date on public.appointments(appointment_date);
create index if not exists idx_visits_date on public.visits(visit_date);
create index if not exists idx_prescriptions_date on public.prescriptions(prescription_date);
create index if not exists idx_invoices_date on public.invoices(invoice_date);
create index if not exists idx_patients_name on public.patients(full_name);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ declare t text; begin
  foreach t in array array['profiles','clinic_settings','patients','appointments','visits','prescriptions','invoices','medical_reports','inventory'] loop
    execute format('drop trigger if exists trg_touch_updated_at on public.%I', t);
    execute format('create trigger trg_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

create or replace function public.is_active_user() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and active=true);
$$;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and active=true and role='admin');
$$;

create or replace function public.has_permission(p_module text, p_action text) returns boolean language sql stable security definer set search_path=public as $$
  select public.is_admin() or exists(
    select 1 from public.user_permissions up join public.profiles p on p.id=up.user_id
    where up.user_id=auth.uid() and p.active=true and up.module=p_module and
      case p_action when 'view' then up.can_view when 'add' then up.can_add when 'edit' then up.can_edit when 'delete' then up.can_delete when 'print' then up.can_print else false end
  );
$$;

create or replace function public.system_initialized() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where role='admin');
$$;
grant execute on function public.system_initialized() to anon, authenticated;

create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path=public as $$
declare first_user boolean;
begin
  select not exists(select 1 from public.profiles) into first_user;
  insert into public.profiles(id,username,full_name,role,active)
  values(
    new.id,
    lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1))),
    coalesce(new.raw_user_meta_data->>'full_name','مستخدم جديد'),
    case when first_user then 'admin' else 'pending' end,
    first_user
  );
  if first_user then
    insert into public.user_permissions(user_id,module,can_view,can_add,can_edit,can_delete,can_print)
    select new.id, m, true,true,true,true,true from unnest(array['dashboard','patients','appointments','visits','prescriptions','invoices','reports','inventory','users','backup','settings']) m;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.user_permissions enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.visits enable row level security;
alter table public.prescriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.medical_reports enable row level security;
alter table public.inventory enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy permissions_select on public.user_permissions for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy permissions_admin_insert on public.user_permissions for insert to authenticated with check (public.is_admin());
create policy permissions_admin_update on public.user_permissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy permissions_admin_delete on public.user_permissions for delete to authenticated using (public.is_admin());

create policy settings_select on public.clinic_settings for select to authenticated using (public.has_permission('settings','view') or public.is_active_user());
create policy settings_insert on public.clinic_settings for insert to authenticated with check (public.has_permission('settings','add'));
create policy settings_update on public.clinic_settings for update to authenticated using (public.has_permission('settings','edit')) with check (public.has_permission('settings','edit'));

do $$ declare pair text[]; tbl text; mod text; begin
  foreach pair slice 1 in array array[
    array['patients','patients'],array['appointments','appointments'],array['visits','visits'],array['prescriptions','prescriptions'],
    array['invoices','invoices'],array['medical_reports','reports'],array['inventory','inventory']
  ] loop
    tbl:=pair[1]; mod:=pair[2];
    execute format('create policy %I on public.%I for select to authenticated using (public.has_permission(%L,%L))',tbl||'_select',tbl,mod,'view');
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_permission(%L,%L) and created_by=auth.uid())',tbl||'_insert',tbl,mod,'add');
    execute format('create policy %I on public.%I for update to authenticated using (public.has_permission(%L,%L)) with check (public.has_permission(%L,%L))',tbl||'_update',tbl,mod,'edit',mod,'edit');
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_permission(%L,%L))',tbl||'_delete',tbl,mod,'delete');
  end loop;
end $$;

create policy audit_select_admin on public.audit_logs for select to authenticated using (public.is_admin());
create policy audit_insert_active on public.audit_logs for insert to authenticated with check (public.is_active_user() and user_id=auth.uid());

insert into public.clinic_settings(clinic_name) select 'عيادتي' where not exists(select 1 from public.clinic_settings);
