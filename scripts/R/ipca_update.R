# ============================================================================
# PX2 - Atualização do IPCA
# ============================================================================
# Este script lê os dados do IPCA dos arquivos Excel e gera o ipca.json
#
# Uso:
#   source("ipca_update.R")
#   # ou via terminal:
#   Rscript ipca_update.R
# ============================================================================

# Carrega configurações e funções
get_script_dir <- function() {
  args <- commandArgs(trailingOnly = FALSE)
  file_arg <- grep("--file=", args, value = TRUE)
  if (length(file_arg) > 0) {
    return(dirname(sub("--file=", "", file_arg)))
  }
  tryCatch({ dirname(sys.frame(1)$ofile) }, error = function(e) { "." })
}
script_dir <- get_script_dir()
if (script_dir == "." && dir.exists("scripts/R")) script_dir <- "scripts/R"
if (script_dir != "." && dir.exists(script_dir)) setwd(script_dir)

source("config.R")
source("utils.R")

# ============================================================================
# CONFIGURAÇÃO - AJUSTE AQUI OS NOMES DAS SHEETS
# ============================================================================

# Mapeamento das sheets do Excel para as seções do JSON
SHEET_MAPPING <- list(
  mom = "MoM",              # Variação mensal
  a12 = "Acumulado_12m",    # Acumulado 12 meses
  pesos = "Pesos"           # Pesos
)

# Mapeamento das sheets de difusão
DIFUSAO_SHEETS <- list(
  difusao_bruta = "Difusao_Bruta",
  difusao_dessaz = "Difusao_Dessazonalizada"
)

# ============================================================================
# FUNÇÕES DE PROCESSAMENTO
# ============================================================================

#' Processa o arquivo principal de núcleos
process_nucleos <- function() {
  message("\n📊 Processando núcleos IPCA...")
  
  if (!file.exists(IPCA_NUCLEOS_FILE)) {
    stop(sprintf("Arquivo não encontrado: %s", IPCA_NUCLEOS_FILE))
  }
  
  result <- list()
  
  for (json_key in names(SHEET_MAPPING)) {
    sheet_name <- SHEET_MAPPING[[json_key]]
    df <- read_excel_sheet(IPCA_NUCLEOS_FILE, sheet_name, day = 1)
    
    if (!is.null(df) && nrow(df) > 0) {
      result[[json_key]] <- df_to_records(df)
    }
  }
  
  return(result)
}

#' Processa o arquivo de difusão
process_difusao <- function() {
  message("\n📊 Processando difusão IPCA...")
  
  if (!file.exists(IPCA_DIFUSAO_FILE)) {
    warning(sprintf("Arquivo de difusão não encontrado: %s", IPCA_DIFUSAO_FILE))
    return(list())
  }
  
  result <- list()
  
  for (json_key in names(DIFUSAO_SHEETS)) {
    sheet_name <- DIFUSAO_SHEETS[[json_key]]
    df <- read_excel_sheet(IPCA_DIFUSAO_FILE, sheet_name, day = 1)
    
    if (!is.null(df) && nrow(df) > 0) {
      # Renomeia coluna Data para data_date se necessário
      if ("Data" %in% names(df) && !"data_date" %in% names(df)) {
        df$data_date <- format_date_for_json(df$Data, day = 1)
        df <- df %>% select(-Data)
      }
      result[[json_key]] <- df_to_records(df)
    }
  }
  
  return(result)
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main <- function() {
  message("=" %>% rep(60) %>% paste(collapse = ""))
  message("IPCA - Atualização de Dados")
  message("=" %>% rep(60) %>% paste(collapse = ""))
  
  # Verifica diretórios
  check_dirs()
  
  # Processa dados
  data <- process_nucleos()
  
  # Adiciona difusão
  difusao_data <- process_difusao()
  data <- c(data, difusao_data)
  
  # Valida
  if (!validate_json_structure(data)) {
    stop("Estrutura do JSON inválida")
  }
  
  # Salva
  save_indicator_json(
    data = data,
    output_path = IPCA_OUTPUT,
    indicator = "IPCA",
    description = "Índice Nacional de Preços ao Consumidor Amplo - Inflação oficial do Brasil"
  )
  
  message("\n✅ IPCA atualizado com sucesso!")
  message("=" %>% rep(60) %>% paste(collapse = ""))
}

# Executa se chamado diretamente
if (!interactive()) {
  main()
} else {
  message("\n💡 Para executar, chame: main()")
}

