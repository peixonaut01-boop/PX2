# ============================================================================
# PX2 - Atualização da PMS (Pesquisa Mensal de Serviços)
# ============================================================================
# Este script baixa os dados da PMS do SIDRA, processa e gera o pms.json
# ============================================================================

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

if (!requireNamespace("zoo", quietly = TRUE)) install.packages("zoo")
library(zoo)
library(dplyr)
library(lubridate)
library(readxl)
library(purrr)

process_pms <- function() {
  message("\n📊 Iniciando atualização da PMS...")

  # ----------------------------------------------------------------------------
  # 1. DOWNLOAD DOS DADOS
  # ----------------------------------------------------------------------------
  
  # Volume por atividades com ajuste sazonal (SA) 
  url_sa <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8688.xlsx&terr=N&rank=-&query=t/8688/n1/all/v/7168/p/all/c11046/56726/c12355/all/d/v7168%205/l/,c12355%2Bc11046,p%2Bt%2Bv"
  destfile_sa <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PMS Volume (SA)...")
  download.file(url_sa, destfile_sa, mode = "wb")
  
  vol.sa <- read_excel(destfile_sa, skip=2) %>%
    slice(-c(1, nrow(.))) %>%
    select(-c(1:3)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2011-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.))

  # Volume por atividades sem ajuste sazonal (NSA) 
  url_nsa <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8688.xlsx&terr=N&rank=-&query=t/8688/n1/all/v/7167/p/all/c11046/56726/c12355/all/d/v7167%205/l/,c12355%2Bc11046,p%2Bt%2Bv"
  destfile_nsa <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PMS Volume (NSA)...")
  download.file(url_nsa, destfile_nsa, mode = "wb")
  
  vol.nsa <- read_excel(destfile_nsa, skip=2) %>%
    slice(-c(1, nrow(.))) %>%
    select(-c(1:3)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2011-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.))

  # ----------------------------------------------------------------------------
  # 2. TRATAMENTO
  # ----------------------------------------------------------------------------
  message("  🔄 Processando dados...")

  # MoM
  all.mom <- vol.sa %>%
    mutate_at(vars(-1), ~ 100*(./lag(., n = 1) -1)) %>%
    mutate_at(vars(-1), ~ round(., digits=2))

  # YoY
  all.yoy <- vol.nsa  %>%
    mutate_at(vars(-1), ~ 100*(./lag(., n = 12) -1)) %>%
    mutate_at(vars(-1), ~ round(., digits=2))

  # QoQ
  all.qoq <- vol.sa %>%
    mutate_at(vars(-1), ~ zoo::rollmean(., k=3, fill=NA, align='right')) %>%
    mutate_at(vars(-1), ~ 100*(./lag(., n = 3)-1)) %>%
    mutate_at(vars(-1), ~ round(., digits=2))

  # ----------------------------------------------------------------------------
  # 3. PREPARAR OUTPUT
  # ----------------------------------------------------------------------------
  
  prepare_df <- function(df) {
    df$data_date <- format_date_for_json(df$Dates, day = 1)
    df <- df %>% select(-Dates) %>% select(data_date, everything())
    return(df)
  }

  return(list(
    mom = df_to_records(prepare_df(all.mom)),
    yoy = df_to_records(prepare_df(all.yoy)),
    qoq = df_to_records(prepare_df(all.qoq)),
    sa_index = df_to_records(prepare_df(vol.sa))
  ))
}

main <- function() {
  message("=" %>% rep(60) %>% paste(collapse = ""))
  message("PMS - Pesquisa Mensal de Serviços")
  message("=" %>% rep(60) %>% paste(collapse = ""))
  
  check_dirs()
  
  data <- process_pms()
  
  if (!exists("PMS_OUTPUT")) {
    PMS_OUTPUT <- file.path(OUTPUT_DIR, "pms.json")
  }
  
  save_indicator_json(
    data = data,
    output_path = PMS_OUTPUT,
    indicator = "PMS",
    description = "Pesquisa Mensal de Serviços (IBGE) - Volume de Serviços"
  )
  
  message("\n✅ PMS atualizada com sucesso!")
  message("=" %>% rep(60) %>% paste(collapse = ""))
}

if (!interactive()) {
  main()
}
