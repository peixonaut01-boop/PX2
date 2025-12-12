# ============================================================================
# PX2 - Executa Todos os Scripts de Atualização
# ============================================================================
# 
# Uso:
#   source("run_all.R")
#   # ou via terminal:
#   Rscript run_all.R
#
# Via PowerShell:
#   Rscript "C:\Users\Lucas\Desktop\PX2\scripts\R\run_all.R"
# ============================================================================

# Define diretório de trabalho
get_script_dir <- function() {
  args <- commandArgs(trailingOnly = FALSE)
  file_arg <- grep("--file=", args, value = TRUE)
  if (length(file_arg) > 0) {
    return(dirname(sub("--file=", "", file_arg)))
  }
  # Fallback se rodando via source ou interativo
  tryCatch({
    dirname(sys.frame(1)$ofile)
  }, error = function(e) {
    "."
  })
}

script_dir <- get_script_dir()
if (script_dir == "." && dir.exists("scripts/R")) {
  script_dir <- "scripts/R"
}
setwd(script_dir)

# Carrega dependências
source("config.R")

message("=" %>% rep(70) %>% paste(collapse = ""))
message("PX2 - ATUALIZAÇÃO COMPLETA DE DADOS")
message(sprintf("Iniciado em: %s", Sys.time()))
message("=" %>% rep(70) %>% paste(collapse = ""))

# Lista de scripts para executar
scripts <- c(
  "ipca_update.R",
  "ipca15_update.R",
  "pim_update.R",
  "pmc_update.R",
  "pms_update.R"
  # Adicione mais scripts aqui conforme necessário:
  # "projecoes_update.R"
)

# Executa cada script
results <- list()

for (script in scripts) {
  message(sprintf("\n▶ Executando: %s", script))
  message("-" %>% rep(50) %>% paste(collapse = ""))
  
  result <- tryCatch({
    source(script, local = TRUE)
    list(success = TRUE, error = NULL)
  }, error = function(e) {
    list(success = FALSE, error = e$message)
  })
  
  results[[script]] <- result
  
  if (result$success) {
    message(sprintf("✅ %s - OK", script))
  } else {
    message(sprintf("❌ %s - ERRO: %s", script, result$error))
  }
}

# Resumo
message("\n" %>% paste0("=" %>% rep(70) %>% paste(collapse = "")))
message("RESUMO")
message("=" %>% rep(70) %>% paste(collapse = ""))

success_count <- sum(sapply(results, function(r) r$success))
total_count <- length(results)

for (script in names(results)) {
  status <- if (results[[script]]$success) "✅" else "❌"
  message(sprintf("  %s %s", status, script))
}

message(sprintf("\nTotal: %d/%d scripts executados com sucesso", success_count, total_count))
message(sprintf("Finalizado em: %s", Sys.time()))

# Retorna código de saída
if (success_count < total_count) {
  message("\n⚠️  Alguns scripts falharam!")
  if (!interactive()) quit(status = 1)
} else {
  message("\n🎉 Todos os scripts executados com sucesso!")
  if (!interactive()) quit(status = 0)
}

