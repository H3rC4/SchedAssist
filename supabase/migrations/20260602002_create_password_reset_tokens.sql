-- Create password_reset_tokens table
create table password_reset_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index idx_password_reset_tokens_token on password_reset_tokens(token);
create index idx_password_reset_tokens_user_id on password_reset_tokens(user_id);
create index idx_password_reset_tokens_expires_at on password_reset_tokens(expires_at);

-- Enable RLS
alter table password_reset_tokens enable row level security;

-- Create policies
create policy "Users can read their own password reset tokens"
  on password_reset_tokens for select
  using (auth.uid() = user_id);

create policy "Service role can manage password reset tokens"
  on password_reset_tokens for all
  using (true);