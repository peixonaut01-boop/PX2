# ============================================================================
# PX2 - Configurações
# ============================================================================
# Edite os paths abaixo conforme sua máquina

# Diretório de saída (onde os JSONs serão salvos)
# Diretório de saída (onde os JSONs serão salvos)
# Ajuste para caminho relativo baseando-se que o script roda em scripts/R ou root
if (dir.exists("../../frontend/public/data")) {
    OUTPUT_DIR <- normalizePath("../../frontend/public/data")
} else if (dir.exists("frontend/public/data")) {
    OUTPUT_DIR <- normalizePath("frontend/public/data")
} else {
    # Fallback ou criar
    OUTPUT_DIR <- "frontend/public/data"
}

# Diretório dos dados fonte (seus Excels/dados brutos)
# INPUT_DIR <- "C:/Users/Lucas/Desktop/reports PX/all data"
INPUT_DIR <- "../../data_raw" # Placeholder não existente

# Subpastas dos dados
IPCA_DIR <- file.path(INPUT_DIR, "IPCA")
IPCA15_DIR <- file.path(INPUT_DIR, "IPCA 15")

# Arquivos de entrada (ajuste conforme seus arquivos)
IPCA_NUCLEOS_FILE <- file.path(IPCA_DIR, "nucleos_ipca_completo.xlsx")
IPCA_DIFUSAO_FILE <- file.path(IPCA_DIR, "difusao_IPCA.xlsx")
IPCA15_NUCLEOS_FILE <- file.path(IPCA15_DIR, "IPCA15_nucleos.xlsx")
IPCA15_DIFUSAO_FILE <- file.path(IPCA15_DIR, "IPCA15_Difusao.xlsx")

# Arquivos de saída
IPCA_OUTPUT <- file.path(OUTPUT_DIR, "ipca.json")
IPCA15_OUTPUT <- file.path(OUTPUT_DIR, "ipca15.json")
PROJECOES_OUTPUT <- file.path(OUTPUT_DIR, "projecoes.json")
PIM_OUTPUT <- file.path(OUTPUT_DIR, "pim.json")
PMC_OUTPUT <- file.path(OUTPUT_DIR, "pmc.json")
PMS_OUTPUT <- file.path(OUTPUT_DIR, "pms.json")

# ============================================================================
# Pacotes necessários
# ============================================================================
# Instale se não tiver:
# install.packages(c("jsonlite", "readxl", "dplyr", "lubridate"))

required_packages <- c("jsonlite", "readxl", "dplyr", "lubridate")

for (pkg in required_packages) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    message(sprintf("Instalando pacote: %s", pkg))
    install.packages(pkg)
  }
}

library(jsonlite)
library(readxl)
library(dplyr)
library(lubridate)

# ============================================================================
# Verificar diretórios
# ============================================================================
check_dirs <- function() {
  if (!dir.exists(OUTPUT_DIR)) {
    stop(sprintf("Diretório de saída não existe: %s", OUTPUT_DIR))
  }
  if (!dir.exists(INPUT_DIR)) {
    warning(sprintf("Diretório de entrada não existe: %s", INPUT_DIR))
  }
  message("✓ Diretórios verificados")
}

message("Config carregado. OUTPUT_DIR: ", OUTPUT_DIR)

