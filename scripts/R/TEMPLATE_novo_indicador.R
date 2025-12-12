# ============================================================================
# PX2 - TEMPLATE para Novo Indicador
# ============================================================================
# Copie este arquivo e renomeie para: [indicador]_update.R
# Exemplo: pib_update.R, selic_update.R
#
# Depois ajuste as configurações abaixo conforme seu indicador.
# ============================================================================

# Carrega configurações e funções
script_dir <- dirname(sys.frame(1)$ofile)
if (is.null(script_dir)) script_dir <- "."
setwd(script_dir)

source("config.R")
source("utils.R")

# ============================================================================
# CONFIGURAÇÃO DO INDICADOR - AJUSTE AQUI
# ============================================================================

# Nome do indicador
INDICATOR_NAME <- "MEU_INDICADOR"
INDICATOR_DESC <- "Descrição do meu indicador"

# Arquivo de entrada (Excel ou outro)
INPUT_FILE <- file.path(INPUT_DIR, "minha_pasta", "meu_arquivo.xlsx")

# Arquivo de saída
OUTPUT_FILE <- file.path(OUTPUT_DIR, "meu_indicador.json")

# Mapeamento das sheets (se for Excel com múltiplas sheets)
SHEET_MAPPING <- list(
  mom = "MoM",           # Nome da sheet de variação mensal
  a12 = "Acumulado12m"   # Nome da sheet de acumulado 12 meses
  # Adicione mais conforme necessário
)

# Dia para data (1 para início do mês, 15 para meio)
DATE_DAY <- 1

# ============================================================================
# FUNÇÕES DE PROCESSAMENTO
# ============================================================================

process_data <- function() {
  message(sprintf("\n📊 Processando %s...", INDICATOR_NAME))
  
  if (!file.exists(INPUT_FILE)) {
    stop(sprintf("Arquivo não encontrado: %s", INPUT_FILE))
  }
  
  result <- list()
  
  # Opção 1: Múltiplas sheets
  for (json_key in names(SHEET_MAPPING)) {
    sheet_name <- SHEET_MAPPING[[json_key]]
    df <- read_excel_sheet(INPUT_FILE, sheet_name, day = DATE_DAY)
    
    if (!is.null(df) && nrow(df) > 0) {
      result[[json_key]] <- df_to_records(df)
    }
  }
  
  # Opção 2: Sheet única (descomente se preferir)
  # df <- read_excel(INPUT_FILE)
  # df$data_date <- format_date_for_json(df$Data, day = DATE_DAY)
  # df <- df %>% select(-Data)
  # result$dados <- df_to_records(df)
  
  return(result)
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main <- function() {
  message("=" %>% rep(60) %>% paste(collapse = ""))
  message(sprintf("%s - Atualização de Dados", INDICATOR_NAME))
  message("=" %>% rep(60) %>% paste(collapse = ""))
  
  # Verifica diretórios
  check_dirs()
  
  # Processa dados
  data <- process_data()
  
  # Salva
  save_indicator_json(
    data = data,
    output_path = OUTPUT_FILE,
    indicator = INDICATOR_NAME,
    description = INDICATOR_DESC
  )
  
  message(sprintf("\n✅ %s atualizado com sucesso!", INDICATOR_NAME))
  message("=" %>% rep(60) %>% paste(collapse = ""))
}

# Executa se chamado diretamente
if (!interactive()) {
  main()
} else {
  message("\n💡 Para executar, chame: main()")
}

