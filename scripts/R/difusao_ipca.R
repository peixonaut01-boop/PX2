# ==============================================================================
# SCRIPT FINAL: DIFUSÃO IPCA (MÉDIA HISTÓRICA vs MÉDIA MÓVEL)
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
# Cria diretório se não existir (usa IPCA_DIR do config.R)
if (!dir.exists(IPCA_DIR)) dir.create(IPCA_DIR, recursive = TRUE)

packages <- c("dplyr", "readxl", "stringr", "lubridate", "zoo", "writexl", "utils")
invisible(lapply(packages, function(pkg){ 
  if (!requireNamespace(pkg, quietly=T)) install.packages(pkg)
  library(pkg, character.only=T) 
}))

# 2. LINKS
url_bruta <- "https://sidra.ibge.gov.br/geratabela/DownloadSelecaoComplexa/-1523854210"
url_sa    <- "https://sidra.ibge.gov.br/geratabela/DownloadSelecaoComplexa/185103155"

# 3. FUNÇÃO DE PROCESSAMENTO BLINDADA (Leitura e Limpeza)
processar_sidra_zip <- function(url, nome_tipo) {
  message(paste0("\n>> [", nome_tipo, "] Baixando ZIP..."))
  
  dest_zip <- tempfile(fileext = ".zip")
  options(timeout = 600)
  
  tryCatch({
    download.file(url, destfile = dest_zip, mode = "wb")
  }, error = function(e) stop("Erro no download."))
  
  unzip_dir <- tempfile()
  unzip(dest_zip, exdir = unzip_dir)
  excel_path <- list.files(unzip_dir, full.names = T, pattern = "\\.xlsx?$")[1]
  
  message(paste0(">> [", nome_tipo, "] Detectando cabeçalho..."))
  
  # DIAGNÓSTICO DE CABEÇALHO
  df_scan <- read_excel(excel_path, col_names = FALSE, n_max = 20)
  df_scan_char <- as.data.frame(lapply(df_scan, as.character))
  
  # Procura linha com código "1101002"
  idx_header <- which(apply(df_scan_char, 1, function(x) any(str_detect(x, "1101002"))))[1]
  
  if (is.na(idx_header)) stop("Cabeçalho não encontrado.")
  
  # ARRUMA NOMES DAS COLUNAS (Preenche vazios)
  header_vec <- as.character(df_scan[idx_header, ])
  header_vec[is.na(header_vec)] <- paste0("Coluna_Vazia_", seq_along(header_vec)[is.na(header_vec)])
  
  # LÊ DADOS REAIS
  df_raw <- read_excel(excel_path, skip = idx_header, col_names = header_vec)
  
  # Acha coluna de data (texto do mês)
  col_data_idx <- which(apply(head(df_raw, 5), 2, function(x) any(str_detect(as.character(x), "janeiro|fevereiro|março|abril"))))[1]
  if(is.na(col_data_idx)) col_data_idx <- 2
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
  
  # FILTRO SUBITENS
  cols_subitens <- colnames(df_clean)[str_detect(colnames(df_clean), "^\\d{7}")]
  
  if(length(cols_subitens) == 0) return(NULL)
  
  df_final <- df_clean %>%
    select(Data, all_of(cols_subitens)) %>%
    mutate(across(-Data, ~ suppressWarnings(as.numeric(.))))
  
  return(df_final)
}

# 4. FUNÇÃO DE CÁLCULO (ATUALIZADA)
calcular_indices <- function(df_input, tipo_media = "mm3m") {
  if(is.null(df_input)) return(NULL)
  
  matriz <- df_input %>% select(-Data)
  
  # Difusão: % de itens > 0
  difusao <- rowMeans(matriz > 0, na.rm = TRUE) * 100
  
  df_res <- data.frame(Data = df_input$Data, Difusao_Mensal = round(difusao, 2)) %>%
    arrange(Data)
  
  # LÓGICA CONDICIONAL: TIPO DE MÉDIA
  if (tipo_media == "mm3m") {
    # Média Móvel de 3 Meses (Para Dessazonalizada)
    df_res <- df_res %>% 
      mutate(Tendencia = round(rollmean(Difusao_Mensal, k = 3, fill = NA, align = "right"), 2))
    
  } else if (tipo_media == "historica") {
    # Média Histórica de todo o período (Para Bruta)
    media_total <- mean(df_res$Difusao_Mensal, na.rm = TRUE)
    df_res <- df_res %>% 
      mutate(Media_Historica = round(media_total, 2))
  }
  
  return(df_res)
}

# 5. EXECUÇÃO
# ------------------------------------------------------------------------------

main_difusao <- function() {
  message(">> Iniciando processamento de Difusão IPCA...")
  
  # A) BRUTA -> Calcula MÉDIA HISTÓRICA
  df_bruta_limpa <- processar_sidra_zip(url_bruta, "Bruta")
  res_bruta <- calcular_indices(df_bruta_limpa, tipo_media = "historica") 
  
  # B) DESSAZONALIZADA -> Calcula MÉDIA MÓVEL 3M
  df_sa_limpa <- processar_sidra_zip(url_sa, "Dessazonalizada")
  res_sa <- calcular_indices(df_sa_limpa, tipo_media = "mm3m")
  
  # 6. EXPORTAÇÃO
  # ------------------------------------------------------------------------------
  message("\n>> Exportando arquivo final...")
  
  lista_final <- list()
  if(!is.null(res_bruta)) lista_final[["Difusao_Bruta"]] <- res_bruta
  if(!is.null(res_sa))    lista_final[["Difusao_Dessazonalizada"]] <- res_sa
  
  # Usa CAMINHO DO CONFIG
  output_file <- IPCA_DIFUSAO_FILE
  
  if(length(lista_final) > 0) {
    write_xlsx(lista_final, output_file)
    message(paste("SUCESSO! Arquivo salvo em:", output_file))
  } else {
    stop("Falha ao processar os dados.")
  }
}

main_difusao()