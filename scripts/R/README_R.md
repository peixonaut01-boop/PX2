# 📊 Estrutura R - PX Economics

Guia completo para trabalhar com dados em R e gerar JSONs para o site.

## 🗂️ Estrutura de Pastas

```
scripts/R/
├── config.R              # Configurações (paths, pacotes)
├── utils.R               # Funções úteis (conversão, limpeza)
├── INICIO_AQUI.R        # Script de início rápido
├── templates/            # 📝 Templates para novos indicadores
│   └── template_simples.R
├── workflows/            # 🔄 Exemplos completos
│   └── exemplo_completo.R
├── data_input/          # 📥 Coloque seus arquivos Excel aqui
├── ipca_update.R        # Script IPCA
├── ipca15_update.R      # Script IPCA-15
└── run_all.R            # Executar todos os scripts
```

---

## 🚀 Início Rápido (3 minutos)

### 1. Preparar Ambiente

```r
# No RStudio ou R Console
setwd("C:/Users/Lucas/Desktop/PX2/scripts/R")
source("INICIO_AQUI.R")
```

### 2. Ver Exemplos

```r
# Carregar funções
source("workflows/exemplo_completo.R")

# Ver menu de exemplos
menu_exemplos()
```

### 3. Criar Seu Indicador

```r
# Copiar template
file.copy("templates/template_simples.R", "meu_indicador.R")

# Editar meu_indicador.R e executar
source("meu_indicador.R")
processar_indicador()
```

---

## 📝 Usando o Template Simples

### Passo 1: Copiar o Template

```r
file.copy("templates/template_simples.R", "meu_novo_indicador.R")
```

### Passo 2: Editar 3 Seções

Abra `meu_novo_indicador.R` e edite:

**[EDITAR 1] - Informações Básicas:**

```r
NOME_INDICADOR <- "IGP_M"
DESCRICAO <- "Índice Geral de Preços - Mercado"
ARQUIVO_EXCEL <- file.path(INPUT_DIR, "IGP", "igpm_dados.xlsx")
ARQUIVO_SAIDA <- file.path(OUTPUT_DIR, "igpm.json")
```

**[EDITAR 2] - Sheets do Excel:**

```r
SHEETS <- list(
  mom = "Variacao_Mensal",     # Nome da sua sheet
  a12 = "Acum_12_Meses",       # Nome da sua sheet
  pesos = "Pesos_Componentes"  # Nome da sua sheet (opcional)
)
```

### Passo 3: Executar

```r
source("meu_novo_indicador.R")
```

O JSON será salvo automaticamente em: `frontend/public/data/meu_indicador.json`

---

## 🛠️ Funções Úteis Disponíveis

### Ler Dados do Excel

```r
# Ler uma sheet específica
dados <- read_excel_sheet(
  file_path = "caminho/para/arquivo.xlsx",
  sheet_name = "MoM",
  day = 1  # Dia para padronizar datas (1 = primeiro do mês)
)
```

### Formatar Datas

```r
# Converter datas para formato JSON (YYYY-MM-DD)
datas_formatadas <- format_date_for_json(df$Data, day = 1)

# Converter "janeiro 2024" para "2024-01-01"
data_pt <- parse_portuguese_date("janeiro 2024", day = 1)
```

### Limpar Dados

```r
# Remover NaN e Inf (substitui por NA/NULL)
dados_limpos <- clean_for_json(dados)
```

### Converter para JSON

```r
# Data frame → Lista de registros (formato JSON)
registros <- df_to_records(dados)
```

### Salvar JSON Completo

```r
estrutura <- list(
  mom = df_to_records(dados_mensais),
  a12 = df_to_records(dados_12m)
)

save_indicator_json(
  data = estrutura,
  output_path = "frontend/public/data/meu_indicador.json",
  indicator = "MEU_INDICADOR",
  description = "Descrição do indicador"
)
```

---

## 🔄 Workflows Completos

### Workflow 1: Atualizar IPCA

```r
source("ipca_update.R")
# Lê: C:/Users/Lucas/Desktop/reports PX/all data/IPCA/nucleos_ipca_completo.xlsx
# Gera: frontend/public/data/ipca.json
```

### Workflow 2: Atualizar IPCA-15

```r
source("ipca15_update.R")
# Lê: C:/Users/Lucas/Desktop/reports PX/all data/IPCA 15/IPCA15_nucleos.xlsx
# Gera: frontend/public/data/ipca15.json
```

### Workflow 3: Atualizar Todos

```r
source("run_all.R")
# Executa todos os scripts de atualização
```

---

## 📋 Estrutura do Excel Esperada

### Formato das Sheets

Cada sheet deve ter:

| data_date (ou Data) | Indicador_1 | Indicador_2 | Indicador_3 |
|---------------------|-------------|-------------|-------------|
| 2024-01-01         | 0.5         | 1.2         | 0.8         |
| 2024-02-01         | 0.4         | 1.1         | 0.7         |
| 2024-03-01         | 0.6         | 1.3         | 0.9         |

**Importante:**
- Primeira coluna = Data (qualquer formato de data do Excel)
- Demais colunas = Indicadores numéricos
- Nome das colunas será usado no JSON

### Exemplo de Excel com 3 Sheets

**Sheet "MoM" (Variação Mensal):**
- Coluna Data + Indicadores

**Sheet "Acumulado_12m" (Acumulado 12 meses):**
- Coluna Data + Indicadores

**Sheet "Pesos" (Pesos dos componentes - opcional):**
- Coluna Data + Pesos

---

## 🎯 Formato do JSON Gerado

O script gera um JSON neste formato:

```json
{
  "mom": [
    {
      "data_date": "2024-01-01",
      "IPCA": 0.42,
      "Nucleo_EX0": 0.38,
      "Nucleo_EX1": 0.35
    },
    {
      "data_date": "2024-02-01",
      "IPCA": 0.83,
      "Nucleo_EX0": 0.52,
      "Nucleo_EX1": 0.48
    }
  ],
  "a12": [
    {
      "data_date": "2024-01-01",
      "IPCA": 4.51,
      "Nucleo_EX0": 3.85,
      "Nucleo_EX1": 3.62
    }
  ],
  "metadata": {
    "indicator": "IPCA",
    "description": "Índice Nacional de Preços ao Consumidor Amplo",
    "source": "IBGE/Sidra",
    "last_updated": "2024-12-10T14:30:00",
    "frequency": "monthly"
  }
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Processar Dados Simples

```r
# Ler arquivo
arquivo <- "C:/Users/Lucas/Desktop/reports PX/all data/IPCA/nucleos_ipca_completo.xlsx"

# Ler sheet MoM
dados <- read_excel_sheet(arquivo, "MoM", day = 1)

# Ver dados
head(dados)
```

### Exemplo 2: Processar e Salvar

```r
# Ler sheets
dados_mom <- read_excel_sheet(arquivo, "MoM", day = 1)
dados_a12 <- read_excel_sheet(arquivo, "Acumulado_12m", day = 1)

# Estruturar
estrutura <- list(
  mom = df_to_records(dados_mom),
  a12 = df_to_records(dados_a12)
)

# Salvar
save_indicator_json(
  data = estrutura,
  output_path = file.path(OUTPUT_DIR, "meu_indicador.json"),
  indicator = "MEU_IND",
  description = "Meu indicador econômico"
)
```

### Exemplo 3: Calcular Indicador Derivado

```r
# Ler dados
dados <- read_excel_sheet(arquivo, "MoM", day = 1)

# Calcular média móvel 3 meses
library(dplyr)
dados <- dados %>%
  mutate(
    IPCA_MM3 = zoo::rollmean(IPCA, k = 3, fill = NA, align = "right")
  )

# Salvar
resultado <- list(mom = df_to_records(dados))
save_indicator_json(resultado, "frontend/public/data/ipca_mm3.json", "IPCA_MM3", "IPCA - Média Móvel 3 Meses")
```

---

## ⚙️ Configurações (config.R)

### Paths Importantes

```r
# Onde os JSONs serão salvos
OUTPUT_DIR <- "C:/Users/Lucas/Desktop/PX2/frontend/public/data"

# Onde estão seus arquivos Excel
INPUT_DIR <- "C:/Users/Lucas/Desktop/reports PX/all data"
```

### Personalizar Paths

Edite `config.R` para apontar para seus diretórios:

```r
# Seus dados
INPUT_DIR <- "C:/SeuCaminho/Dados"

# Subpastas
IPCA_DIR <- file.path(INPUT_DIR, "Inflacao/IPCA")
```

---

## 🐛 Troubleshooting

### Erro: "Arquivo não encontrado"

**Solução:** Verifique o caminho em `config.R`

```r
# Ver configuração atual
message("INPUT_DIR: ", INPUT_DIR)
message("IPCA_DIR: ", IPCA_DIR)

# Verificar se arquivo existe
file.exists(IPCA_NUCLEOS_FILE)
```

### Erro: "Sheet não encontrada"

**Solução:** Ver sheets disponíveis

```r
library(readxl)
excel_sheets("caminho/arquivo.xlsx")
```

### Erro: "Coluna 'data_date' não encontrada"

**Solução:** A primeira coluna deve ser Data

```r
# Verificar colunas
df <- read_excel("arquivo.xlsx", sheet = "MoM")
names(df)  # Ver nomes das colunas
```

### JSON com valores NULL ou NaN

**Solução:** Use `clean_for_json()`

```r
dados <- read_excel_sheet(arquivo, "MoM")
dados_limpos <- clean_for_json(dados)  # Remove NaN/Inf
```

---

## 📚 Pacotes Necessários

```r
# Instalar pacotes (se necessário)
install.packages(c("jsonlite", "readxl", "dplyr", "lubridate", "zoo"))

# Carregar
library(jsonlite)  # JSON
library(readxl)    # Excel
library(dplyr)     # Manipulação
library(lubridate) # Datas
library(zoo)       # Médias móveis
```

---

## 🎓 Próximos Passos

1. **Começar:** Execute `source("INICIO_AQUI.R")`
2. **Ver Exemplos:** Execute `source("workflows/exemplo_completo.R")`
3. **Criar Seu Indicador:** Copie `templates/template_simples.R`
4. **Explorar:** Veja `ipca_update.R` e `ipca15_update.R` como referência

---

## 📞 Estrutura de Arquivos do Projeto

```
PX2/
├── frontend/
│   └── public/
│       └── data/              # ← JSONs gerados aqui
│           ├── ipca.json
│           ├── ipca15.json
│           └── seu_indicador.json
│
├── scripts/
│   └── R/                     # ← Você trabalha aqui
│       ├── config.R
│       ├── utils.R
│       ├── INICIO_AQUI.R
│       ├── templates/
│       ├── workflows/
│       └── data_input/        # ← Coloque Excel aqui (opcional)
│
└── reports PX/                # ← Seus dados Excel (externo)
    └── all data/
        ├── IPCA/
        └── IPCA 15/
```

---

**Última atualização:** Dezembro 2024  
**Autor:** PX Economics Team

