alter table public.clinic_settings
  add column if not exists prescription_offset_x_mm numeric(6,2) not null default 0,
  add column if not exists prescription_offset_y_mm numeric(6,2) not null default 0;

comment on column public.clinic_settings.prescription_offset_x_mm is
  'Horizontal print calibration in millimeters for preprinted A5 prescription paper';
comment on column public.clinic_settings.prescription_offset_y_mm is
  'Vertical print calibration in millimeters for preprinted A5 prescription paper';
