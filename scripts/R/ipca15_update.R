# ============================================================================
# PX2 - Atualização do IPCA-15
# ============================================================================
# Este script lê os dados do IPCA-15 dos arquivos Excel e gera o ipca15.json
#
# Uso:
#   source("ipca15_update.R")
#   # ou via terminal:
#   Rscript ipca15_update.R
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
  mom = "MoM_nucleos",      # Variação mensal
  a12 = "A12_nucleos",      # Acumulado 12 meses
  pesos = "Pesos_nucleos"   # Pesos
)

# ============================================================================
# FUNÇÕES DE PROCESSAMENTO
# ============================================================================

#' Processa o arquivo principal de núcleos IPCA-15
process_nucleos <- function() {
  message("\n📊 Processando núcleos IPCA-15...")
  
  if (!file.exists(IPCA15_NUCLEOS_FILE)) {
    stop(sprintf("Arquivo não encontrado: %s", IPCA15_NUCLEOS_FILE))
  }
  
  result <- list()
  
  for (json_key in names(SHEET_MAPPING)) {
    sheet_name <- SHEET_MAPPING[[json_key]]
    
    # Lê Excel
    df <- tryCatch({
      read_excel(IPCA15_NUCLEOS_FILE, sheet = sheet_name)
    }, error = function(e) {
      warning(sprintf("Erro ao ler sheet '%s': %s", sheet_name, e$message))
      return(NULL)
    })
    
    if (is.null(df) || nrow(df) == 0) next
    
    # Processa coluna de data
    # IPCA-15 pode ter datas no formato "novembro 2025"
    date_cols <- c("data_date", "data", "Data", "date")
    found_col <- intersect(date_cols, names(df))[1]
    
    if (!is.na(found_col)) {
      # Tenta converter
      if (is.character(df[[found_col]][1]) && 
          grepl("[a-zA-Z]", df[[found_col]][1])) {
        # Formato "mês ano"
        df$data_date <- sapply(df[[found_col]], parse_portuguese_date, day = 15)
      } else {
        # Formato data normal
        df$data_date <- format_date_for_json(df[[found_col]], day = 15)
      }
      
      if (found_col != "data_date") {
        df <- df %>% select(-all_of(found_col))
      }
    }
    
    # Renomeia "IPCA 15" para "IPCA15" (sem espaço)
    names(df) <- gsub("IPCA 15", "IPCA15", names(df))
    
    # Move data_date para primeira coluna
    df <- df %>% select(data_date, everything())
    
    # Limpa e converte
    df <- clean_for_json(df)
    result[[json_key]] <- df_to_records(df)
    
    message(sprintf("  ✓ %s: %d linhas", sheet_name, nrow(df)))
  }
  
  return(result)
}

#' Processa o arquivo de difusão IPCA-15
process_difusao <- function() {
  message("\n📊 Processando difusão IPCA-15...")
  
  if (!file.exists(IPCA15_DIFUSAO_FILE)) {
    warning(sprintf("Arquivo de difusão não encontrado: %s", IPCA15_DIFUSAO_FILE))
    return(list())
  }
  
  df <- tryCatch({
    read_excel(IPCA15_DIFUSAO_FILE)
  }, error = function(e) {
    warning(sprintf("Erro ao ler difusão: %s", e$message))
    return(NULL)
  })
  
  if (is.null(df) || nrow(df) == 0) {
    return(list())
  }
  
  # Processa data
  if ("Data" %in% names(df)) {
    df$data_date <- format_date_for_json(df$Data, day = 15)
    df <- df %>% select(-Data)
  }
  
  # Renomeia colunas para padrão
  if ("Difusao" %in% names(df)) {
    df <- df %>% rename(Difusao_Mensal = Difusao)
  }
  
  df <- clean_for_json(df)
  
  message(sprintf("  ✓ Difusão: %d linhas", nrow(df)))
  
  return(list(difusao = df_to_records(df)))
}

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main <- function() {
  message("=" %>% rep(60) %>% paste(collapse = ""))
  message("IPCA-15 - Atualização de Dados")
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
    output_path = IPCA15_OUTPUT,
    indicator = "IPCA-15",
    description = "Índice Nacional de Preços ao Consumidor Amplo 15 - Prévia da inflação"
  )
  
  message("\n✅ IPCA-15 atualizado com sucesso!")
  message("=" %>% rep(60) %>% paste(collapse = ""))
}

# Executa se chamado diretamente
if (!interactive()) {
  main()
} else {
  message("\n💡 Para executar, chame: main()")
}

