# ============================================================================
# PX2 - Atualização do PIM (Produção Industrial Mensal)
# ============================================================================
# Este script baixa os dados do PIM do SIDRA, processa e gera o pim.json
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

# Pacotes adicionais
if (!requireNamespace("zoo", quietly = TRUE)) install.packages("zoo")
if (!requireNamespace("reshape2", quietly = TRUE)) install.packages("reshape2")
library(zoo)
library(reshape2)
library(dplyr)
library(lubridate)
library(readxl)

# ============================================================================
# FUNÇÕES DE PROCESSAMENTO
# ============================================================================

process_pim <- function() {
  message("\n📊 Iniciando atualização do PIM...")

  # ----------------------------------------------------------------------------
  # 1. DOWNLOAD DOS DADOS
  # ----------------------------------------------------------------------------
  
  # Por atividades industriais (SA - Com Ajuste Sazonal)
  url_ativ_sa <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8888.xlsx&terr=N&rank=-&query=t/8888/n1/all/v/12607/p/all/c544/all/d/v12607%205/l/v,c544,p%2Bt"
  destfile_sa <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PIM Atividades (SA)...")
  download.file(url_ativ_sa, destfile_sa, mode = "wb")
  
  ativ.sa <- read_excel(destfile_sa, skip=3) %>%
    slice(-c(nrow(.))) %>%
    select(-c(1:2)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2002-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.))
    
  # Por atividades (NSA - Sem Ajuste Sazonal)
  url_ativ_nsa <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8888.xlsx&terr=N&rank=-&query=t/8888/n1/all/v/12606/p/all/c544/all/d/v12606%205/l/v,c544,p%2Bt"
  destfile_nsa <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PIM Atividades (NSA)...")
  download.file(url_ativ_nsa, destfile_nsa, mode = "wb")
  
  ativ.nsa <- read_excel(destfile_nsa, skip=3) %>%
    slice(-c(nrow(.))) %>%
    select(-c(1:2)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2002-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.))

  # Por categorias (SA)
  url_cat_sa <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8887.xlsx&terr=N&rank=-&query=t/8887/n1/all/v/12607/p/all/c543/129278,129283,129300,129301,129305/d/v12607%205/l/,c543,p%2Bt%2Bv"
  destfile_cat_sa <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PIM Categorias (SA)...")
  download.file(url_cat_sa, destfile_cat_sa, mode = "wb")
  
  categorias.sa <- read_excel(destfile_cat_sa, skip=2) %>%
    slice(-c(nrow(.))) %>%
    select(-c(1:3)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2002-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.))

  # Por categorias (NSA)
  url_cat_nsa <- "https://sidra.ibge.gov.br/geratabela?format=xlsx&name=tabela8887.xlsx&terr=N&rank=-&query=t/8887/n1/all/v/12606/p/all/c543/129278,129283,129300,129301,129305/d/v12606%205/l/,c543,p%2Bt%2Bv"
  destfile_cat_nsa <- tempfile(fileext = ".xlsx")
  message("  ⬇️ Baixando PIM Categorias (NSA)...")
  download.file(url_cat_nsa, destfile_cat_nsa, mode = "wb")
  
  categorias.nsa <- read_excel(destfile_cat_nsa, skip=2) %>%
    slice(-c(nrow(.))) %>%
    select(-c(1:3)) %>%
    mutate(Dates=seq.Date(from=lubridate::ymd("2002-01-01"), by="month", length=nrow(.))) %>%
    relocate(Dates) %>%
    mutate_at(vars(-1), ~ as.numeric(.))
    
  # ----------------------------------------------------------------------------
  # 2. TRATAMENTO E CÁLCULOS
  # ----------------------------------------------------------------------------
  message("  🔄 Processando dados...")

  # MoM (Month-over-Month)
  all.mom <- ativ.sa %>% 
    left_join(x=., y=categorias.sa, by="Dates") %>%
    mutate_at(vars(-1), ~ 100*(./lag(., n = 1) -1)) %>%
    mutate_at(vars(-1), ~ round(., digits=2))

  # QoQ (Quarter-over-Quarter) - Média móvel 3 meses vs 3 meses anteriores
  all.qoq <- ativ.sa %>% 
    left_join(x=., y=categorias.sa, by="Dates") %>%
    mutate_at(vars(-1), ~ zoo::rollmean(., k=3, fill=NA, align='right')) %>%
    mutate_at(vars(-1), ~ 100*(./lag(., n = 3)-1)) %>%
    mutate_at(vars(-1), ~ round(., digits=2))

  # YoY (Year-over-Year)
  all.yoy <- ativ.nsa %>% 
    left_join(x=., y=categorias.nsa, by="Dates") %>%
    mutate_at(vars(-1), ~ 100*(./lag(., n = 12) -1)) %>%
    mutate_at(vars(-1), ~ round(., digits=2))

  # Index Level SA
  all.sa <- ativ.sa %>% 
    left_join(x=., y=categorias.sa, by="Dates")

  # ----------------------------------------------------------------------------
  # 3. PREPARAR OUTPUT
  # ----------------------------------------------------------------------------
  
  # Formatar datas para JSON
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

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

main <- function() {
  message("=" %>% rep(60) %>% paste(collapse = ""))
  message("PIM - Produção Industrial Mensal")
  message("=" %>% rep(60) %>% paste(collapse = ""))
  
  check_dirs()
  
  # Processa
  data <- process_pim()
  
  # Define caminho de saída (se não estiver em config.R, usa padrão)
  if (!exists("PIM_OUTPUT")) {
    PIM_OUTPUT <- file.path(OUTPUT_DIR, "pim.json")
  }
  
  # Salva
  save_indicator_json(
    data = data,
    output_path = PIM_OUTPUT,
    indicator = "PIM",
    description = "Produção Industrial Mensal (IBGE) - Variação Mensal, Anual e Trimestral"
  )
  
  message("\n✅ PIM atualizado com sucesso!")
  message("=" %>% rep(60) %>% paste(collapse = ""))
}

if (!interactive()) {
  main()
}
