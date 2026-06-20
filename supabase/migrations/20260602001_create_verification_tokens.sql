-- Create email_verification_tokens table
create table email_verification_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index idx_email_verification_tokens_token on email_verification_tokens(token);
create index idx_email_verification_tokens_user_id on email_verification_tokens(user_id);
create index idx_email_verification_tokens_expires_at on email_verification_tokens(expires_at);

-- Enable RLS
alter table email_verification_tokens enable row level security;

-- Create policies
create policy "Users can read their own verification tokens"
  on email_verification_tokens for select
  using (auth.uid() = user_id);

create policy "Service role can manage verification tokens"
  on email_verification_tokens for all
  using (true);