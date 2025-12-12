# ============================================================================
# PX2 - Atualização da PMC (Pesquisa Mensal de Comércio)
# ============================================================================
# Este script baixa os dados da PMC do SIDRA, processa e gera o pmc.json
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

process_pmc <- function() {
  message("\n📊 Iniciando atualização da PMC...")

  # ----------------------------------------------------------------------------
  # 1. DOWNLOAD DOS DADOS
  # ----------------------------------------------------------------------------
  
  # Volume PMC por atividades com ajuste sazonal (SA) 
  url_sa <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8883.xlsx&terr=N&rank=-&query=t/8883/n1/all/v/7170/p/all/c11046/56736/c85/all/d/v7170%205/l/,c11046%2Bv%2Bc85,p%2Bt"
  destfile_sa <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PMC Atividades (SA)...")
  download.file(url_sa, destfile_sa, mode = "wb")
  
  ativ.sa <- read_excel(destfile_sa, skip=4) %>%
    slice(-c(nrow(.))) %>%
    select(-c(1:2)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2000-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.))

  # Volume PMC por atividades sem ajuste sazonal (NSA)
  url_nsa <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8883.xlsx&terr=N&rank=-&query=t/8883/n1/all/v/7169/p/all/c11046/56736/c85/all/d/v7169%205/l/,c11046%2Bv%2Bc85,p%2Bt"
  destfile_nsa <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PMC Atividades (NSA)...")
  download.file(url_nsa, destfile_nsa, mode = "wb")
  
  ativ.nsa <- read_excel(destfile_nsa, skip=4) %>%
    slice(-c(nrow(.))) %>%
    select(-c(1:2)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2000-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.))

  # PMC Restrita (NSA e SA)
  url_pmc <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8880.xlsx&terr=N&rank=-&query=t/8880/n1/all/v/7169,7170/p/all/c11046/56734/d/v7169%205,v7170%205/l/,c11046%2Bv,p%2Bt"
  destfile_pmc <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PMC Restrita...")
  download.file(url_pmc, destfile_pmc, mode = "wb")
  
  pmc.nivel <- read_excel(destfile_pmc, skip=3) %>%
    slice(-c(nrow(.))) %>%
    select(-c(1:2)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2000-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.)) %>%
    stats::setNames(., c("Dates","PMC NSA", "PMC SA"))

  # PMC Ampliada (NSA e SA)
  url_pmca <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8881.xlsx&terr=N&rank=-&query=t/8881/n1/all/v/7169,7170/p/all/c11046/56736/d/v7169%205,v7170%205/l/,c11046%2Bv,p%2Bt"
  destfile_pmca <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PMC Ampliada...")
  download.file(url_pmca, destfile_pmca, mode = "wb")
  
  pmca.nivel <- read_excel(destfile_pmca, skip=3) %>%
    slice(-c(nrow(.))) %>%
    select(-c(1:2)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2003-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.)) %>%
    stats::setNames(., c("Dates","PMCA NSA", "PMCA SA"))

  # ----------------------------------------------------------------------------
  # 2. TRATAMENTO
  # ----------------------------------------------------------------------------
  message("  🔄 Processando dados...")

  # Combinando dados
  all.sa <- ativ.sa %>% 
    left_join(x=., pmc.nivel[,-2], by="Dates") %>%
    left_join(x=., pmca.nivel[,-2], by="Dates")

  all.nsa <- ativ.nsa %>% 
    left_join(x=., pmc.nivel[,-3], by="Dates") %>%
    left_join(x=., pmca.nivel[,-3], by="Dates")

  # MoM
  all.mom <- all.sa %>%
    mutate_at(vars(-1), ~ 100*(./lag(., n = 1) -1)) %>%
    mutate_at(vars(-1), ~ round(., digits=2))

  # QoQ
  all.qoq <- all.sa %>%
    mutate_at(vars(-1), ~ zoo::rollmean(., k=3, fill=NA, align='right')) %>%   
    mutate_at(vars(-1), ~ 100*(./lag(., n = 3)-1)) %>%
    mutate_at(vars(-1), ~ round(., digits=2))

  # YoY
  all.yoy <- all.nsa  %>%
    mutate_at(vars(-1), ~ 100*(./lag(., n = 12) -1)) %>%
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
    sa_index = df_to_records(prepare_df(all.sa))
  ))
}

main <- function() {
  message("=" %>% rep(60) %>% paste(collapse = ""))
  message("PMC - Pesquisa Mensal do Comércio")
  message("=" %>% rep(60) %>% paste(collapse = ""))
  
  check_dirs()
  
  data <- process_pmc()
  
  if (!exists("PMC_OUTPUT")) {
    PMC_OUTPUT <- file.path(OUTPUT_DIR, "pmc.json")
  }
  
  save_indicator_json(
    data = data,
    output_path = PMC_OUTPUT,
    indicator = "PMC",
    description = "Pesquisa Mensal de Comércio (IBGE) - Varejo Restrito e Ampliado"
  )
  
  message("\n✅ PMC atualizada com sucesso!")
  message("=" %>% rep(60) %>% paste(collapse = ""))
}

if (!interactive()) {
  main()
}
