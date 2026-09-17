create table if not exists public.medicine_catalog (
  id uuid primary key default gen_random_uuid(),
  trade_name text not null unique,
  generic_name text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_medicine_catalog_trade_name
  on public.medicine_catalog (lower(trade_name));
create index if not exists idx_medicine_catalog_generic_name
  on public.medicine_catalog (lower(generic_name));

drop trigger if exists trg_touch_updated_at on public.medicine_catalog;
create trigger trg_touch_updated_at
before update on public.medicine_catalog
for each row execute function public.touch_updated_at();

alter table public.medicine_catalog enable row level security;

drop policy if exists medicine_catalog_select on public.medicine_catalog;
create policy medicine_catalog_select on public.medicine_catalog
for select to authenticated using (public.is_active_user());

drop policy if exists medicine_catalog_insert on public.medicine_catalog;
create policy medicine_catalog_insert on public.medicine_catalog
for insert to authenticated
with check (
  public.has_permission('prescriptions','add')
  and created_by = auth.uid()
);

drop policy if exists medicine_catalog_update on public.medicine_catalog;
create policy medicine_catalog_update on public.medicine_catalog
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists medicine_catalog_delete on public.medicine_catalog;
create policy medicine_catalog_delete on public.medicine_catalog
for delete to authenticated using (public.is_admin());
