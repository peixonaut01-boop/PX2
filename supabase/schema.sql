-- ============================================
-- PX Economics - Database Schema
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'basico', 'avancado', 'ultra')),
  approved BOOLEAN DEFAULT FALSE,
  downloads_today INTEGER DEFAULT 0,
  last_download_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de histórico de downloads
CREATE TABLE IF NOT EXISTS downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_category TEXT NOT NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança para profiles
-- Usuários podem ver e atualizar seu próprio perfil
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 5. Políticas de segurança para downloads
-- Usuários podem ver seus próprios downloads
CREATE POLICY "Users can view own downloads" 
  ON downloads FOR SELECT 
  USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios downloads
CREATE POLICY "Users can insert own downloads" 
  ON downloads FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 6. Função para criar perfil automaticamente após registro (AUTO-APROVADO)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    TRUE  -- Auto-aprovar todos os novos usuários
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Função para resetar downloads diários (executar via cron ou manualmente)
CREATE OR REPLACE FUNCTION reset_daily_downloads()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET downloads_today = 0, 
      last_download_date = CURRENT_DATE
  WHERE last_download_date < CURRENT_DATE OR last_download_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Função para registrar download e verificar limite
CREATE OR REPLACE FUNCTION record_download(
  p_user_id UUID,
  p_file_name TEXT,
  p_file_category TEXT
)
RETURNS JSON AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_limit INTEGER;
  v_result JSON;
BEGIN
  -- Busca perfil do usuário
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  -- Verifica se usuário está aprovado
  IF NOT v_profile.approved THEN
    RETURN json_build_object('success', false, 'error', 'Conta não aprovada');
  END IF;
  
  -- Define limite baseado no tier
  v_limit := CASE v_profile.tier
    WHEN 'free' THEN 2
    WHEN 'basico' THEN 999
    WHEN 'avancado' THEN 999
    WHEN 'ultra' THEN 999
    ELSE 2
  END;
  
  -- Reseta contador se é um novo dia
  IF v_profile.last_download_date IS NULL OR v_profile.last_download_date < CURRENT_DATE THEN
    UPDATE profiles 
    SET downloads_today = 0, last_download_date = CURRENT_DATE 
    WHERE id = p_user_id;
    v_profile.downloads_today := 0;
  END IF;
  
  -- Verifica limite
  IF v_profile.downloads_today >= v_limit THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Limite de downloads atingido',
      'limit', v_limit,
      'tier', v_profile.tier
    );
  END IF;
  
  -- Registra download
  INSERT INTO downloads (user_id, file_name, file_category)
  VALUES (p_user_id, p_file_name, p_file_category);
  
  -- Atualiza contador
  UPDATE profiles 
  SET downloads_today = downloads_today + 1,
      last_download_date = CURRENT_DATE
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'downloads_remaining', v_limit - v_profile.downloads_today - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(approved);
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at);

-- ============================================
-- Pronto! Tabelas criadas com sucesso.
-- ============================================

