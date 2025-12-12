# ============================================================================
# TEMPLATE SIMPLES - Converter Excel para JSON
# ============================================================================
# 
# Use este template para criar novos indicadores rapidamente
# Siga os passos marcados com [EDITAR]
#
# ============================================================================

# Carregar funções
source("../config.R")
source("../utils.R")

# ============================================================================
# [EDITAR 1] - CONFIGURAÇÕES DO SEU INDICADOR
# ============================================================================

# Nome do indicador (usado no JSON)
NOME_INDICADOR <- "MEU_INDICADOR"  # [EDITAR]

# Descrição
DESCRICAO <- "Descrição do meu indicador"  # [EDITAR]

# Arquivo de entrada (Excel)
ARQUIVO_EXCEL <- file.path(INPUT_DIR, "PASTA", "arquivo.xlsx")  # [EDITAR]

# Arquivo de saída (JSON)
ARQUIVO_SAIDA <- file.path(OUTPUT_DIR, "meu_indicador.json")  # [EDITAR]

# ============================================================================
# [EDITAR 2] - ESTRUTURA DAS SHEETS DO EXCEL
# ============================================================================

# Mapeamento: chave_json = "Nome da Sheet no Excel"
SHEETS <- list(
  mom = "MoM",              # [EDITAR] Nome da sheet com variação mensal
  a12 = "Acumulado_12m",    # [EDITAR] Nome da sheet com acumulado 12m
  pesos = "Pesos"           # [EDITAR] Nome da sheet com pesos (opcional)
)

# ============================================================================
# PROCESSAMENTO (NÃO PRECISA EDITAR)
# ============================================================================

processar_indicador <- function() {
  
  message("=" %>% rep(60) %>% paste(collapse = ""))
  message("Processando: ", NOME_INDICADOR)
  message("=" %>% rep(60) %>% paste(collapse = ""))
  
  # Verificar se arquivo existe
  if (!file.exists(ARQUIVO_EXCEL)) {
    stop(sprintf("Arquivo não encontrado: %s", ARQUIVO_EXCEL))
  }
  
  # Processar cada sheet
  resultado <- list()
  
  for (chave in names(SHEETS)) {
    sheet_name <- SHEETS[[chave]]
    
    message(sprintf("\n📊 Lendo sheet: %s", sheet_name))
    
    # Ler sheet do Excel
    df <- read_excel_sheet(ARQUIVO_EXCEL, sheet_name, day = 1)
    
    if (!is.null(df) && nrow(df) > 0) {
      # Converter para formato JSON
      resultado[[chave]] <- df_to_records(df)
      message(sprintf("   ✓ %d linhas, %d colunas", nrow(df), ncol(df)))
    } else {
      warning(sprintf("   ⚠ Sheet '%s' vazia ou não encontrada", sheet_name))
    }
  }
  
  # Validar estrutura
  if (length(resultado) == 0) {
    stop("Nenhum dado foi processado!")
  }
  
  # Salvar JSON
  save_indicator_json(
    data = resultado,
    output_path = ARQUIVO_SAIDA,
    indicator = NOME_INDICADOR,
    description = DESCRICAO
  )
  
  message("\n✅ Processamento concluído!")
  message("=" %>% rep(60) %>% paste(collapse = ""))
  
  return(resultado)
}

# ============================================================================
# EXECUÇÃO
# ============================================================================

# Executar se chamado diretamente
if (!interactive()) {
  processar_indicador()
} else {
  message("\n💡 Para executar, chame: processar_indicador()")
}

