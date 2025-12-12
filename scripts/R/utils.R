# ============================================================================
# PX2 - Funções Utilitárias
# ============================================================================

source("config.R")

# ----------------------------------------------------------------------------
# Formatação de datas
# ----------------------------------------------------------------------------

#' Formata data para o padrão do site (YYYY-MM-DD)
#' @param date_col Coluna de datas
#' @param day Dia a usar (1 para IPCA, 15 para IPCA-15)
#' @return Vetor de strings no formato "YYYY-MM-DD"
format_date_for_json <- function(date_col, day = 1) {
  dates <- as.Date(date_col)
  sprintf("%04d-%02d-%02d", year(dates), month(dates), day)
}

#' Converte "janeiro 2025" para "2025-01-15"
#' @param date_str String no formato "mês ano"
#' @param day Dia a usar
parse_portuguese_date <- function(date_str, day = 15) {
  months_pt <- c(
    "janeiro" = 1, "fevereiro" = 2, "março" = 3, "abril" = 4,
    "maio" = 5, "junho" = 6, "julho" = 7, "agosto" = 8,
    "setembro" = 9, "outubro" = 10, "novembro" = 11, "dezembro" = 12
  )
  
  parts <- strsplit(tolower(trimws(date_str)), " ")[[1]]
  if (length(parts) == 2) {
    month_num <- months_pt[parts[1]]
    year_num <- as.integer(parts[2])
    if (!is.na(month_num) && !is.na(year_num)) {
      return(sprintf("%04d-%02d-%02d", year_num, month_num, day))
    }
  }
  return(NA_character_)
}

# ----------------------------------------------------------------------------
# Limpeza de dados
# ----------------------------------------------------------------------------

#' Remove NaN e Inf, substitui por NULL (para JSON)
#' @param df Data frame
#' @return Data frame limpo
clean_for_json <- function(df) {
  df %>%
    mutate(across(where(is.numeric), ~ifelse(is.nan(.) | is.infinite(.), NA, .)))
}

#' Converte data frame para lista de records (formato JSON)
#' @param df Data frame
#' @return Lista de listas (cada linha é uma lista)
df_to_records <- function(df) {
  df <- clean_for_json(df)
  # jsonlite::toJSON com dataframe="rows" faz isso automaticamente
  # mas para controle manual:
  lapply(1:nrow(df), function(i) as.list(df[i, ]))
}

# ----------------------------------------------------------------------------
# Salvar JSON
# ----------------------------------------------------------------------------

#' Salva dados no formato JSON do site
#' @param data Lista com os dados (mom, a12, pesos, etc.)
#' @param output_path Caminho do arquivo de saída
#' @param indicator Nome do indicador (ex: "IPCA")
#' @param description Descrição do indicador
save_indicator_json <- function(data, output_path, indicator, description) {
  
  # Adiciona metadata
  data$metadata <- list(
    indicator = indicator,
    description = description,
    source = "IBGE/Sidra",
    last_updated = format(Sys.time(), "%Y-%m-%dT%H:%M:%S"),
    frequency = "monthly"
  )
  
  # Converte para JSON
  json_str <- toJSON(data, 
                     auto_unbox = TRUE,    # Não colocar valores únicos em array
                     pretty = TRUE,        # Formatado
                     na = "null",          # NA vira null
                     null = "null")        # NULL vira null
  
  # Salva arquivo
  writeLines(json_str, output_path, useBytes = TRUE)
  
  message(sprintf("✓ Salvo: %s", output_path))
  message(sprintf("  Última data: %s", 
                  ifelse(length(data$mom) > 0, 
                         tail(data$mom, 1)[[1]]$data_date, 
                         "N/A")))
}

# ----------------------------------------------------------------------------
# Leitura de Excel
# ----------------------------------------------------------------------------

#' Lê sheet do Excel e formata datas
#' @param file_path Caminho do arquivo Excel
#' @param sheet_name Nome da sheet
#' @param date_col Nome da coluna de data
#' @param day Dia para formatar (1 ou 15)
read_excel_sheet <- function(file_path, sheet_name, date_col = "data_date", day = 1) {
  
  if (!file.exists(file_path)) {
    warning(sprintf("Arquivo não encontrado: %s", file_path))
    return(NULL)
  }
  
  sheets <- excel_sheets(file_path)
  if (!sheet_name %in% sheets) {
    warning(sprintf("Sheet '%s' não encontrada em %s. Disponíveis: %s", 
                    sheet_name, basename(file_path), paste(sheets, collapse = ", ")))
    return(NULL)
  }
  
  df <- read_excel(file_path, sheet = sheet_name)
  
  # Procura coluna de data
  date_cols <- c("data_date", "data", "Data", "date", "DATE")
  found_col <- intersect(date_cols, names(df))[1]
  
  if (!is.na(found_col)) {
    df$data_date <- format_date_for_json(df[[found_col]], day)
    if (found_col != "data_date") {
      df <- df %>% select(-all_of(found_col))
    }
    # Move data_date para primeira coluna
    df <- df %>% select(data_date, everything())
  }
  
  message(sprintf("  ✓ Lido: %s (%d linhas)", sheet_name, nrow(df)))
  return(df)
}

# ----------------------------------------------------------------------------
# Validação
# ----------------------------------------------------------------------------

#' Valida estrutura do JSON antes de salvar
#' @param data Lista com os dados
#' @param required_sections Seções obrigatórias
validate_json_structure <- function(data, required_sections = c("mom", "a12")) {
  missing <- setdiff(required_sections, names(data))
  if (length(missing) > 0) {
    warning(sprintf("Seções faltando: %s", paste(missing, collapse = ", ")))
    return(FALSE)
  }
  
  for (section in required_sections) {
    if (length(data[[section]]) == 0) {
      warning(sprintf("Seção '%s' está vazia", section))
      return(FALSE)
    }
  }
  
  return(TRUE)
}

# ----------------------------------------------------------------------------
# Funções Extras Úteis
# ----------------------------------------------------------------------------

#' Ver resumo de um data frame
#' @param df Data frame
#' @param max_rows Número máximo de linhas para mostrar
resumo_df <- function(df, max_rows = 5) {
  message("\n📊 Resumo do DataFrame:")
  message(sprintf("  Linhas: %d", nrow(df)))
  message(sprintf("  Colunas: %d", ncol(df)))
  message("\n  Colunas: ", paste(names(df), collapse = ", "))
  
  if (nrow(df) > 0) {
    message("\n  Primeiras linhas:")
    print(head(df, max_rows))
    
    if ("data_date" %in% names(df)) {
      primeira_data <- min(df$data_date, na.rm = TRUE)
      ultima_data <- max(df$data_date, na.rm = TRUE)
      message(sprintf("\n  Período: %s a %s", primeira_data, ultima_data))
    }
  }
}

#' Verificar se arquivo JSON foi atualizado recentemente
#' @param json_path Caminho do JSON
#' @param max_hours Horas máximas desde última atualização
verificar_atualizacao <- function(json_path, max_hours = 24) {
  if (!file.exists(json_path)) {
    message("❌ Arquivo não existe: ", json_path)
    return(FALSE)
  }
  
  info <- file.info(json_path)
  horas_desde_modificacao <- as.numeric(difftime(Sys.time(), info$mtime, units = "hours"))
  
  message(sprintf("📄 %s", basename(json_path)))
  message(sprintf("   Última atualização: %s", format(info$mtime, "%Y-%m-%d %H:%M")))
  message(sprintf("   Há %.1f horas", horas_desde_modificacao))
  
  if (horas_desde_modificacao > max_hours) {
    message(sprintf("   ⚠️  Mais de %d horas sem atualização!", max_hours))
    return(FALSE)
  } else {
    message("   ✅ Atualizado recentemente")
    return(TRUE)
  }
}

#' Listar todos os JSONs gerados
listar_jsons <- function(dir = OUTPUT_DIR) {
  if (!dir.exists(dir)) {
    message("❌ Diretório não existe: ", dir)
    return(invisible(NULL))
  }
  
  arquivos <- list.files(dir, pattern = "\\.json$", full.names = TRUE)
  
  if (length(arquivos) == 0) {
    message("📭 Nenhum JSON encontrado em: ", dir)
    return(invisible(NULL))
  }
  
  message("\n📊 JSONs Disponíveis:")
  message(paste(rep("-", 70), collapse = ""))
  
  for (arquivo in arquivos) {
    info <- file.info(arquivo)
    nome <- basename(arquivo)
    tamanho <- format(info$size, units = "auto")
    data_mod <- format(info$mtime, "%Y-%m-%d %H:%M")
    
    message(sprintf("  %-25s | %10s | %s", nome, tamanho, data_mod))
  }
  
  message(paste(rep("-", 70), collapse = ""))
  message(sprintf("Total: %d arquivos", length(arquivos)))
  
  return(invisible(arquivos))
}

#' Preview do JSON (primeiros registros)
#' @param json_path Caminho do JSON
#' @param n_records Número de registros para mostrar
preview_json <- function(json_path, n_records = 3) {
  if (!file.exists(json_path)) {
    message("❌ Arquivo não existe: ", json_path)
    return(invisible(NULL))
  }
  
  dados <- fromJSON(json_path, simplifyVector = FALSE)
  
  message("\n📄 Preview: ", basename(json_path))
  message(paste(rep("=", 70), collapse = ""))
  
  # Metadata
  if (!is.null(dados$metadata)) {
    message("\n📋 Metadados:")
    message("  Indicador: ", dados$metadata$indicator)
    message("  Descrição: ", dados$metadata$description)
    message("  Atualizado: ", dados$metadata$last_updated)
  }
  
  # Primeiros registros de cada seção
  for (secao in names(dados)) {
    if (secao != "metadata" && is.list(dados[[secao]]) && length(dados[[secao]]) > 0) {
      message(sprintf("\n📊 Seção '%s' (%d registros):", secao, length(dados[[secao]])))
      
      n_mostrar <- min(n_records, length(dados[[secao]]))
      for (i in 1:n_mostrar) {
        message("  ", toJSON(dados[[secao]][[i]], auto_unbox = TRUE))
      }
      
      if (length(dados[[secao]]) > n_records) {
        message("  ... (mais ", length(dados[[secao]]) - n_records, " registros)")
      }
    }
  }
  
  message(paste(rep("=", 70), collapse = ""))
  
  return(invisible(dados))
}

message("✓ Utils carregado")

