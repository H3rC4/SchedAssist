const { createClient } = require('@supabase/supabase-js');

// Initialize
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// SQL statements
const sql1 = `
-- Create email_verification_tokens table
create table if not exists email_verification_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists idx_email_verification_tokens_token on email_verification_tokens(token);
create index if not exists idx_email_verification_tokens_user_id on email_verification_tokens(user_id);
create index if not exists idx_email_verification_tokens_expires_at on email_verification_tokens(expires_at);

-- Enable RLS
alter table email_verification_tokens enable row level security;

-- Create policies
create policy if not exists "Users can read their own verification tokens"
  on email_verification_tokens for select
  using (auth.uid() = user_id);

create policy if not exists "Service role can manage verification tokens"
  on email_verification_tokens for all
  using (true);
`;

const sql2 = `
-- Create password_reset_tokens table
create table if not exists password_reset_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists idx_password_reset_tokens_token on password_reset_tokens(token);
create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens(user_id);
create index if not exists idx_password_reset_tokens_expires_at on password_reset_tokens(expires_at);

-- Enable RLS
alter table password_reset_tokens enable row level security;

-- Create policies
create policy if not exists "Users can read their own password reset tokens"
  on password_reset_tokens for select
  using (auth.uid() = user_id);

create policy if not exists "Service role can manage password reset tokens"
  on password_reset_tokens for all
  using (true);
`;

async function applyMigration(sql, name) {
  console.log(`Applying ${name}...`);
  try {
    // We cannot execute arbitrary SQL via the JS client directly.
    // Instead, we can use the rpc function to call a stored procedure, but we don't have one.
    // Alternatively, we can try to use the PostgREST endpoint to execute SQL? Not directly.
    // Since we are stuck, let's try to see if we can at least check the table exists by selecting.
    // We'll do a workaround: use the Supabase JS client to try to select from the table.
    // If it fails, we assume the table doesn't exist and we cannot create it via JS client.
    // We'll output a message and suggest manual creation.
    const { data, error } = await supabase
      .from('email_verification_tokens')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.log(`Table does not exist or cannot be accessed. Error: ${error.message}`);
      console.log('Please create the table manually using the Supabase SQL editor.');
      return false;
    } else {
      console.log(`Table exists.`);
      return true;
    }
  } catch (err) {
    console.error(`Error checking table: ${err.message}`);
    return false;
  }
}

async function main() {
  const exists1 = await applyMigration(sql1, 'email_verification_tokens');
  const exists2 = await applyMigration(sql2, 'password_reset_tokens');

  if (exists1 && exists2) {
    console.log('Both tables exist or are accessible.');
  } else {
    console.log('One or more tables are missing. Please create them manually.');
  }
}

main();