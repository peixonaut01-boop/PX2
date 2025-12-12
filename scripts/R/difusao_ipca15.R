# ==============================================================================
# SCRIPT: DIFUSÃO IPCA-15 (APENAS EXCEL - SEM GRÁFICO)
# ==============================================================================

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

# 1. SETUP
# Cria diretório se não existir (usa IPCA15_DIR do config.R)
if (!dir.exists(IPCA15_DIR)) dir.create(IPCA15_DIR, recursive = TRUE)

packages <- c("dplyr", "readxl", "stringr", "lubridate", "zoo", "writexl", "utils")
invisible(lapply(packages, function(pkg){ 
  if (!requireNamespace(pkg, quietly=T)) install.packages(pkg)
  library(pkg, character.only=T) 
}))

# 2. LINK (IPCA-15 BRUTO)
url_ipca15 <- "https://sidra.ibge.gov.br/geratabela/DownloadSelecaoComplexa/1467827202"

# 3. FUNÇÃO DE PROCESSAMENTO
processar_sidra_zip <- function(url) {
  message(">> Baixando ZIP IPCA-15...")
  
  dest_zip <- tempfile(fileext = ".zip")
  options(timeout = 600)
  
  tryCatch({
    download.file(url, destfile = dest_zip, mode = "wb")
  }, error = function(e) stop("Erro no download. Verifique o link."))
  
  unzip_dir <- tempfile()
  unzip(dest_zip, exdir = unzip_dir)
  excel_path <- list.files(unzip_dir, full.names = T, pattern = "\\.xlsx?$")[1]
  
  message(">> Lendo Excel (Detectando cabeçalho)...")
  
  # DIAGNÓSTICO DE CABEÇALHO
  df_scan <- read_excel(excel_path, col_names = FALSE, n_max = 20)
  df_scan_char <- as.data.frame(lapply(df_scan, as.character))
  
  # Procura linha com código de 7 dígitos (ex: 1101002)
  idx_header <- which(apply(df_scan_char, 1, function(x) any(str_detect(x, "^\\d{7}"))))[1]
  
  if (is.na(idx_header)) stop("Cabeçalho não encontrado.")
  message(paste0("   -> Cabeçalho encontrado na linha: ", idx_header))
  
  # ARRUMA NOMES DAS COLUNAS
  header_vec <- as.character(df_scan[idx_header, ])
  header_vec[is.na(header_vec)] <- paste0("Vazio_", seq_along(header_vec)[is.na(header_vec)])
  
  # LÊ DADOS REAIS
  df_raw <- read_excel(excel_path, skip = idx_header, col_names = header_vec)
  
  # Acha coluna de data (texto do mês)
  col_data_idx <- which(apply(head(df_raw, 5), 2, function(x) any(str_detect(as.character(x), "janeiro|fevereiro|março|abril"))))[1]
  if(is.na(col_data_idx)) col_data_idx <- 1 
  colnames(df_raw)[col_data_idx] <- "Data_Texto"
  
  # TRADUZ DATAS
  traduzir <- function(v) {
    v <- tolower(as.character(v))
    mapa <- c("janeiro"="01", "fevereiro"="02", "março"="03", "marco"="03",
              "abril"="04", "maio"="05", "junho"="06", "julho"="07",
              "agosto"="08", "setembro"="09", "outubro"="10", "novembro"="11", "dezembro"="12")
    for(m in names(mapa)) v <- str_replace(v, m, mapa[m])
    dmy(paste0("01 ", v))
  }
  
  df_clean <- df_raw %>%
    filter(!is.na(Data_Texto)) %>%
    mutate(Data = traduzir(Data_Texto)) %>%
    filter(!is.na(Data)) %>%
    select(Data, everything(), -Data_Texto)
  
  return(df_clean)
}

# 4. CÁLCULO DA DIFUSÃO E MÉDIA HISTÓRICA
calcular_stats <- function(df_input) {
  # Filtra subitens
  cols_subitens <- colnames(df_input)[str_detect(colnames(df_input), "^\\d{7}")]
  
  if(length(cols_subitens) == 0) stop("Nenhum subitem encontrado.")
  
  message(paste("   -> Calculando sobre", length(cols_subitens), "itens..."))
  
  # Matriz Numérica
  matriz <- df_input %>%
    select(all_of(cols_subitens)) %>%
    mutate(across(everything(), ~ suppressWarnings(as.numeric(.))))
  
  # Difusão Mensal
  difusao <- rowMeans(matriz > 0, na.rm = TRUE) * 100
  
  df_res <- data.frame(Data = df_input$Data, Difusao_Mensal = round(difusao, 2)) %>%
    arrange(Data)
  
  # Média Histórica (Valor único para a série toda)
  media_hist <- mean(df_res$Difusao_Mensal, na.rm = TRUE)
  df_res$Media_Historica <- round(media_hist, 2)
  
  return(df_res)
}

# 5. EXECUÇÃO
# ------------------------------------------------------------------------------

main_difusao15 <- function() {
  message(">> Iniciando processamento de Difusão IPCA-15...")
  
  # Processa
  df_ipca15_raw <- processar_sidra_zip(url_ipca15)
  df_final <- calcular_stats(df_ipca15_raw)
  
  # Exporta Excel (com sheets específicos que o ipca15_update.R espera)
  # O ipca15_update.R espera: "Difusao_Bruta" e "Difusao_Dessazonalizada"
  # O script original salvava em sheet única. Vamos ajustar para salvar no formato esperado.
  # Nota: IPCA-15 só tem Bruta aqui? O script original gerava uma lista ou dataframe direto?
  # O original gerava "IPCA15_Difusao.xlsx" com sheet default (provavelmente chamada Sheet1 ou o nome do dataframe)
  
  # O config.R/ipca15_update.R espera:
  # DIFUSAO_SHEETS <- list(difusao_bruta = "Difusao_Bruta", difusao_dessaz = "Difusao_Dessazonalizada")
  # Este script só calcula "Bruta" (com média histórica). 
  # Vamos salvar na sheet "Difusao_Bruta" para ser compatível.
  
  output_list <- list(Difusao_Bruta = df_final)
  
  arquivo_saida <- IPCA15_DIFUSAO_FILE
  write_xlsx(output_list, arquivo_saida)
  
  message("========================================================")
  message(paste("SUCESSO! Excel salvo em:", arquivo_saida))
  message("========================================================")
}

main_difusao15()