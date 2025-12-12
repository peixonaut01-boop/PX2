# ============================================================================
# 🚀 INÍCIO RÁPIDO - PX2 Scripts R
# ============================================================================
#
# Este script configura tudo o que você precisa para começar a trabalhar
# 
# COMO USAR:
#   1. Abra o R ou RStudio
#   2. Execute: source("INICIO_AQUI.R")
#   3. Siga as instruções na tela
#
# ============================================================================

# Limpar console
cat("\014")

# Banner
message("\n", paste(rep("=", 70), collapse = ""))
message("🚀 BEM-VINDO AO PX2 - SCRIPTS R")
message(paste(rep("=", 70), collapse = ""))

# ============================================================================
# PASSO 1: Verificar e Instalar Pacotes
# ============================================================================

message("\n📦 Verificando pacotes necessários...")

pacotes_necessarios <- c("jsonlite", "readxl", "dplyr", "lubridate", "zoo")

pacotes_faltando <- pacotes_necessarios[!(pacotes_necessarios %in% installed.packages()[,"Package"])]

if (length(pacotes_faltando) > 0) {
  message("\n⚠️  Pacotes faltando: ", paste(pacotes_faltando, collapse = ", "))
  
  if (interactive()) {
    resposta <- readline(prompt = "Deseja instalar agora? (s/n): ")
    
    if (tolower(resposta) == "s") {
      message("\n📥 Instalando pacotes...")
      install.packages(pacotes_faltando)
      message("✅ Pacotes instalados!")
    } else {
      message("⚠️  Alguns recursos podem não funcionar sem os pacotes")
    }
  } else {
    message("💡 Execute: install.packages(c('", paste(pacotes_faltando, collapse = "', '"), "'))")
  }
} else {
  message("✅ Todos os pacotes estão instalados!")
}

# ============================================================================
# PASSO 2: Carregar Configurações
# ============================================================================

message("\n⚙️  Carregando configurações...")

tryCatch({
  source("config.R")
  source("utils.R")
  message("✅ Configurações carregadas!")
}, error = function(e) {
  message("❌ Erro ao carregar configurações: ", e$message)
  message("💡 Certifique-se de estar na pasta scripts/R/")
})

# ============================================================================
# PASSO 3: Verificar Diretórios
# ============================================================================

message("\n📁 Verificando diretórios...")

if (exists("OUTPUT_DIR")) {
  if (dir.exists(OUTPUT_DIR)) {
    message(sprintf("✅ Diretório de saída: %s", OUTPUT_DIR))
  } else {
    message(sprintf("⚠️  Diretório de saída não existe: %s", OUTPUT_DIR))
  }
}

if (exists("INPUT_DIR")) {
  if (dir.exists(INPUT_DIR)) {
    message(sprintf("✅ Diretório de entrada: %s", INPUT_DIR))
  } else {
    message(sprintf("⚠️  Diretório de entrada não existe: %s", INPUT_DIR))
    message("💡 Edite config.R para configurar o caminho correto")
  }
}

# ============================================================================
# PASSO 4: Menu de Opções
# ============================================================================

mostrar_menu <- function() {
  
  message("\n", paste(rep("=", 70), collapse = ""))
  message("📋 O QUE VOCÊ QUER FAZER?")
  message(paste(rep("=", 70), collapse = ""))
  
  message("\n🎓 APRENDER:")
  message("  1 - Ver exemplos completos (workflows)")
  message("  2 - Ler documentação (README)")
  
  message("\n📊 ATUALIZAR DADOS:")
  message("  3 - Atualizar IPCA")
  message("  4 - Atualizar IPCA-15")
  message("  5 - Atualizar todos os indicadores")
  
  message("\n➕ CRIAR NOVO:")
  message("  6 - Criar novo indicador (template)")
  
  message("\n🛠️  FERRAMENTAS:")
  message("  7 - Verificar arquivos Excel disponíveis")
  message("  8 - Listar JSONs gerados")
  
  message("\n  0 - Sair")
  
  message("\n", paste(rep("=", 70), collapse = ""))
}

processar_opcao <- function(opcao) {
  
  switch(opcao,
         
         # Opção 1: Ver exemplos
         "1" = {
           message("\n🎓 Carregando exemplos...")
           tryCatch({
             source("workflows/exemplo_completo.R")
             menu_exemplos()
           }, error = function(e) {
             message("❌ Erro: ", e$message)
           })
         },
         
         # Opção 2: Documentação
         "2" = {
           message("\n📚 Abrindo README...")
           if (file.exists("README_R.md")) {
             if (.Platform$OS.type == "windows") {
               shell.exec("README_R.md")
             } else {
               system("open README_R.md")
             }
           } else {
             message("❌ README_R.md não encontrado")
           }
         },
         
         # Opção 3: IPCA
         "3" = {
           message("\n📊 Atualizando IPCA...")
           tryCatch({
             source("ipca_update.R")
             main()
           }, error = function(e) {
             message("❌ Erro: ", e$message)
           })
         },
         
         # Opção 4: IPCA-15
         "4" = {
           message("\n📊 Atualizando IPCA-15...")
           tryCatch({
             source("ipca15_update.R")
             main()
           }, error = function(e) {
             message("❌ Erro: ", e$message)
           })
         },
         
         # Opção 5: Todos
         "5" = {
           message("\n📊 Atualizando todos os indicadores...")
           tryCatch({
             source("run_all.R")
           }, error = function(e) {
             message("❌ Erro: ", e$message)
           })
         },
         
         # Opção 6: Novo indicador
         "6" = {
           message("\n➕ Criando novo indicador...")
           
           if (interactive()) {
             nome <- readline(prompt = "Nome do arquivo (ex: igpm_update): ")
             
             if (nome != "") {
               arquivo_novo <- paste0(nome, ".R")
               
               if (file.exists(arquivo_novo)) {
                 message("⚠️  Arquivo já existe: ", arquivo_novo)
               } else {
                 file.copy("templates/template_simples.R", arquivo_novo)
                 message("✅ Criado: ", arquivo_novo)
                 message("💡 Edite o arquivo e execute: source('", arquivo_novo, "')")
                 
                 if (.Platform$OS.type == "windows") {
                   shell.exec(arquivo_novo)
                 }
               }
             }
           } else {
             message("💡 Execute: file.copy('templates/template_simples.R', 'meu_indicador.R')")
           }
         },
         
         # Opção 7: Verificar Excel
         "7" = {
           message("\n🔍 Arquivos Excel disponíveis:")
           
           if (exists("INPUT_DIR") && dir.exists(INPUT_DIR)) {
             arquivos <- list.files(INPUT_DIR, pattern = "\\.xlsx$", recursive = TRUE, full.names = FALSE)
             
             if (length(arquivos) > 0) {
               for (i in seq_along(arquivos)) {
                 message(sprintf("  %d. %s", i, arquivos[i]))
               }
             } else {
               message("  Nenhum arquivo .xlsx encontrado")
             }
           } else {
             message("  ⚠️  INPUT_DIR não configurado ou não existe")
           }
         },
         
         # Opção 8: Listar JSONs
         "8" = {
           message("\n📄 JSONs gerados:")
           
           if (exists("OUTPUT_DIR") && dir.exists(OUTPUT_DIR)) {
             arquivos <- list.files(OUTPUT_DIR, pattern = "\\.json$", full.names = FALSE)
             
             if (length(arquivos) > 0) {
               for (i in seq_along(arquivos)) {
                 arquivo_completo <- file.path(OUTPUT_DIR, arquivos[i])
                 info <- file.info(arquivo_completo)
                 tamanho <- format(info$size, units = "auto")
                 data_mod <- format(info$mtime, "%Y-%m-%d %H:%M")
                 
                 message(sprintf("  %d. %s (%s) - %s", i, arquivos[i], tamanho, data_mod))
               }
             } else {
               message("  Nenhum arquivo .json encontrado")
             }
           } else {
             message("  ⚠️  OUTPUT_DIR não configurado ou não existe")
           }
         },
         
         # Opção 0: Sair
         "0" = {
           message("\n👋 Até logo!")
           return(FALSE)
         },
         
         # Opção inválida
         {
           message("\n❌ Opção inválida!")
         }
  )
  
  return(TRUE)
}

# ============================================================================
# EXECUÇÃO DO MENU
# ============================================================================

if (interactive()) {
  
  continuar <- TRUE
  
  while (continuar) {
    mostrar_menu()
    opcao <- readline(prompt = "\n👉 Digite o número da opção: ")
    continuar <- processar_opcao(opcao)
    
    if (continuar && opcao != "0") {
      readline(prompt = "\nPressione Enter para continuar...")
    }
  }
  
} else {
  
  message("\n💡 MODO NÃO-INTERATIVO")
  message("\nPara usar o menu interativo, execute:")
  message("  source('INICIO_AQUI.R')")
  message("\nOu execute os scripts diretamente:")
  message("  source('ipca_update.R')")
  message("  source('ipca15_update.R')")
  
  mostrar_menu()
}

