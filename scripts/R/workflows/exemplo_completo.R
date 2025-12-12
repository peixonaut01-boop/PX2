# ============================================================================
# EXEMPLO COMPLETO - Workflow de Processamento de Dados
# ============================================================================
#
# Este exemplo mostra um workflow completo de processamento:
# 1. Ler dados de múltiplos arquivos
# 2. Processar e limpar dados
# 3. Calcular indicadores derivados
# 4. Salvar em JSON
#
# ============================================================================

source("../config.R")
source("../utils.R")

# ============================================================================
# EXEMPLO 1: Processar dados simples (1 arquivo Excel)
# ============================================================================

exemplo_simples <- function() {
  
  message("\n📝 EXEMPLO 1: Processamento Simples\n")
  
  # Caminho do arquivo
  arquivo <- file.path(INPUT_DIR, "IPCA", "nucleos_ipca_completo.xlsx")
  
  # Ler uma sheet específica
  dados <- read_excel_sheet(arquivo, "MoM", day = 1)
  
  # Ver primeiras linhas
  message("Primeiras 3 linhas:")
  print(head(dados, 3))
  
  # Informações básicas
  message(sprintf("\nLinhas: %d | Colunas: %d", nrow(dados), ncol(dados)))
  message("Colunas: ", paste(names(dados), collapse = ", "))
  
  return(dados)
}

# ============================================================================
# EXEMPLO 2: Processar múltiplas sheets
# ============================================================================

exemplo_multiplas_sheets <- function() {
  
  message("\n📝 EXEMPLO 2: Múltiplas Sheets\n")
  
  arquivo <- file.path(INPUT_DIR, "IPCA", "nucleos_ipca_completo.xlsx")
  
  # Sheets para processar
  sheets <- c("MoM", "Acumulado_12m", "Pesos")
  
  # Processar todas
  resultado <- list()
  
  for (sheet in sheets) {
    message(sprintf("Processando: %s", sheet))
    
    df <- read_excel_sheet(arquivo, sheet, day = 1)
    
    if (!is.null(df)) {
      resultado[[sheet]] <- df
      message(sprintf("  ✓ %d linhas", nrow(df)))
    }
  }
  
  return(resultado)
}

# ============================================================================
# EXEMPLO 3: Calcular indicadores derivados
# ============================================================================

exemplo_calculos <- function() {
  
  message("\n📝 EXEMPLO 3: Cálculos e Transformações\n")
  
  # Criar dados de exemplo
  dados <- data.frame(
    data_date = seq.Date(as.Date("2024-01-01"), by = "month", length.out = 12),
    valor = c(0.5, 0.4, 0.3, 0.6, 0.5, 0.4, 0.3, 0.5, 0.4, 0.6, 0.5, 0.4)
  )
  
  # Calcular acumulado 12 meses (exemplo simples)
  dados <- dados %>%
    mutate(
      # Média móvel 3 meses
      media_3m = zoo::rollmean(valor, k = 3, fill = NA, align = "right"),
      
      # Acumulado
      acumulado = cumsum(valor),
      
      # Variação
      variacao = (valor / lag(valor, 1) - 1) * 100
    )
  
  message("Dados com indicadores calculados:")
  print(head(dados, 5))
  
  return(dados)
}

# ============================================================================
# EXEMPLO 4: Salvar em JSON (completo)
# ============================================================================

exemplo_salvar_json <- function() {
  
  message("\n📝 EXEMPLO 4: Salvar JSON Completo\n")
  
  # Criar dados de exemplo
  dados_mom <- data.frame(
    data_date = c("2024-01-01", "2024-02-01", "2024-03-01"),
    Indicador_A = c(0.5, 0.4, 0.6),
    Indicador_B = c(1.2, 1.1, 1.3)
  )
  
  dados_a12 <- data.frame(
    data_date = c("2024-01-01", "2024-02-01", "2024-03-01"),
    Indicador_A = c(4.5, 4.6, 4.7),
    Indicador_B = c(5.8, 5.9, 6.0)
  )
  
  # Estrutura completa
  estrutura <- list(
    mom = df_to_records(dados_mom),
    a12 = df_to_records(dados_a12)
  )
  
  # Salvar
  arquivo_saida <- file.path(OUTPUT_DIR, "exemplo_teste.json")
  
  save_indicator_json(
    data = estrutura,
    output_path = arquivo_saida,
    indicator = "EXEMPLO",
    description = "Indicador de exemplo para demonstração"
  )
  
  message(sprintf("✅ JSON salvo em: %s", arquivo_saida))
  
  return(estrutura)
}

# ============================================================================
# EXEMPLO 5: Pipeline completo (passo a passo)
# ============================================================================

pipeline_completo <- function(arquivo_excel, nome_indicador = "MEU_IND") {
  
  message("\n📝 EXEMPLO 5: Pipeline Completo\n")
  
  # PASSO 1: Ler dados
  message("PASSO 1: Lendo dados...")
  df_mom <- read_excel_sheet(arquivo_excel, "MoM", day = 1)
  df_a12 <- read_excel_sheet(arquivo_excel, "Acumulado_12m", day = 1)
  
  if (is.null(df_mom) || is.null(df_a12)) {
    stop("Erro ao ler dados!")
  }
  
  # PASSO 2: Validar dados
  message("PASSO 2: Validando dados...")
  if (!"data_date" %in% names(df_mom)) {
    stop("Coluna 'data_date' não encontrada!")
  }
  
  # PASSO 3: Limpar dados
  message("PASSO 3: Limpando dados...")
  df_mom <- clean_for_json(df_mom)
  df_a12 <- clean_for_json(df_a12)
  
  # PASSO 4: Estruturar JSON
  message("PASSO 4: Estruturando JSON...")
  estrutura <- list(
    mom = df_to_records(df_mom),
    a12 = df_to_records(df_a12)
  )
  
  # PASSO 5: Salvar
  message("PASSO 5: Salvando JSON...")
  arquivo_saida <- file.path(OUTPUT_DIR, sprintf("%s.json", tolower(nome_indicador)))
  
  save_indicator_json(
    data = estrutura,
    output_path = arquivo_saida,
    indicator = nome_indicador,
    description = sprintf("Indicador %s processado automaticamente", nome_indicador)
  )
  
  message("\n✅ Pipeline concluído com sucesso!")
  
  return(estrutura)
}

# ============================================================================
# MENU INTERATIVO
# ============================================================================

menu_exemplos <- function() {
  
  message("\n" %>% paste0("=" %>% rep(60) %>% paste(collapse = "")))
  message("EXEMPLOS DE WORKFLOWS - PX2")
  message("=" %>% rep(60) %>% paste(collapse = ""))
  message("\nEscolha um exemplo:")
  message("  1 - Processamento Simples")
  message("  2 - Múltiplas Sheets")
  message("  3 - Cálculos e Transformações")
  message("  4 - Salvar JSON")
  message("  5 - Pipeline Completo")
  message("  0 - Sair")
  
  if (interactive()) {
    escolha <- readline(prompt = "\nDigite o número: ")
    
    switch(escolha,
           "1" = exemplo_simples(),
           "2" = exemplo_multiplas_sheets(),
           "3" = exemplo_calculos(),
           "4" = exemplo_salvar_json(),
           "5" = {
             arquivo <- file.path(INPUT_DIR, "IPCA", "nucleos_ipca_completo.xlsx")
             pipeline_completo(arquivo, "EXEMPLO_IPCA")
           },
           "0" = message("Saindo..."),
           message("Opção inválida!")
    )
  } else {
    message("\n💡 Execute em modo interativo para usar o menu")
    message("💡 Ou chame as funções diretamente:")
    message("   - exemplo_simples()")
    message("   - exemplo_multiplas_sheets()")
    message("   - exemplo_calculos()")
    message("   - exemplo_salvar_json()")
    message("   - pipeline_completo(arquivo, nome)")
  }
}

# Executar menu se interativo
if (interactive()) {
  menu_exemplos()
}

