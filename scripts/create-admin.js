require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY precisam estar no .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log("Uso: node scripts/create-admin.js <email> <senha>");
    process.exit(1);
  }

  console.log(`Criando primeiro usuário (Admin) com email: ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Erro ao criar usuário:", error.message);
  } else {
    console.log("Usuário criado com sucesso!");
    console.log("Se este for o primeiro usuário no banco, a trigger do Supabase já configurou a conta como Admin.");
  }
}

main();
