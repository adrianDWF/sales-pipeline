-- Annual turnover from Termene CUI verification

alter table public.leads
  add column if not exists turnover numeric(14, 2),
  add column if not exists turnover_year smallint;

comment on column public.leads.turnover is 'Net turnover (RON) from last Termene balance sheet';
comment on column public.leads.turnover_year is 'Fiscal year for turnover figure';
