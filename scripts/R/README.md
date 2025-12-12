# PX2 - Scripts R para Atualização de Dados

Esta pasta contém os scripts R que geram os JSONs consumidos pelo site PX Economics.

## 📁 Estrutura

```
scripts/R/
├── README.md                    # Este arquivo
├── config.R                     # Configurações e paths
├── utils.R                      # Funções auxiliares
├── ipca_update.R               # Atualiza ipca.json
├── ipca15_update.R             # Atualiza ipca15.json
├── projecoes_update.R          # Atualiza projecoes.json (opcional)
└── run_all.R                   # Roda todos os scripts
```

## 🎯 Destino dos Arquivos

Todos os JSONs devem ser salvos em:
```
C:\Users\Lucas\Desktop\PX2\frontend\public\data\
```

| Arquivo | Descrição |
|---------|-----------|
| `ipca.json` | Dados do IPCA (inflação oficial) |
| `ipca15.json` | Dados do IPCA-15 (prévia) |
| `projecoes.json` | Projeções macroeconômicas |

---

## 📊 Estrutura dos JSONs

### 1. ipca.json

```json
{
  "mom": [
    {
      "data_date": "2025-10-01",
      "IPCA": 0.56,
      "Administrados": 0.51,
      "Combustíveis": 1.09,
      "Energia elétrica": 0.16,
      "Livres": 0.11,
      "Alimentação no domicílio": 0.2,
      "In natura": 3.57,
      "Industrializados": -0.23,
      "Ind Subjacente": -0.5,
      "Serviços": 0.28,
      "Serviços subjacentes": 0.56,
      "Ex0": 0.09,
      "Ex3": 0.11,
      "Duráveis": 0.15,
      "Semiduráveis": -0.19,
      "Não duráveis": -0.14,
      "Tradables": -0.28,
      "Non-tradables": 0.37
    }
  ],
  "a12": [
    {
      "data_date": "2025-10-01",
      "IPCA": 4.76,
      "Administrados": 5.2,
      "Livres": 4.5
    }
  ],
  "pesos": [
    {
      "data_date": "2025-10-01",
      "IPCA": 100,
      "Administrados": 23.5,
      "Livres": 76.5,
      "Alimentação no domicílio": 15.2
    }
  ],
  "difusao_bruta": [
    {
      "data_date": "2025-10-01",
      "Difusao_Mensal": 65.2,
      "Media_Historica": 58.1
    }
  ],
  "difusao_dessaz": [
    {
      "data_date": "2025-10-01",
      "Difusao_Mensal": 63.8,
      "Tendencia": 62.5
    }
  ],
  "metadata": {
    "indicator": "IPCA",
    "description": "Índice Nacional de Preços ao Consumidor Amplo",
    "source": "IBGE/Sidra",
    "last_updated": "2025-12-10T10:30:00",
    "frequency": "monthly"
  }
}
```

#### Campos Obrigatórios em `mom` e `a12`:

| Campo | Descrição |
|-------|-----------|
| `data_date` | Data no formato "YYYY-MM-DD" (usar dia 01 para IPCA) |
| `IPCA` | Índice geral |
| `Administrados` | Preços administrados |
| `Livres` | Preços livres |
| `Alimentação no domicílio` | Alimentos em casa |
| `Industrializados` | Bens industriais |
| `Serviços` | Setor de serviços |
| `Serviços subjacentes` | Núcleo de serviços |
| `Ex0` | Núcleo EX0 |
| `Ex3` | Núcleo EX3 |

---

### 2. ipca15.json

Estrutura idêntica ao `ipca.json`, mas:
- Campo principal é `IPCA15` (não `IPCA`)
- `data_date` usa dia 15 (ex: "2025-10-15")

```json
{
  "mom": [
    {
      "data_date": "2025-10-15",
      "IPCA15": 0.54,
      "Administrados": 0.48,
      ...
    }
  ],
  "a12": [...],
  "pesos": [...],
  "difusao": [
    {
      "data_date": "2025-10-15",
      "Difusao_Mensal": 62.5,
      "Media_Historica": 58.0
    }
  ],
  "metadata": {
    "indicator": "IPCA-15",
    "description": "Prévia da inflação",
    ...
  }
}
```

---

### 3. projecoes.json

```json
{
  "metadata": {
    "last_updated": "2025-12-10T10:00:00",
    "updated_by": "sistema"
  },
  "indicadores": {
    "IPCA": { 
      "nome": "IPCA", 
      "unidade": "%", 
      "categoria": "Inflação BR", 
      "tipo": "mensal" 
    },
    "SELIC": { 
      "nome": "Taxa Selic", 
      "unidade": "% a.a.", 
      "categoria": "Juros", 
      "tipo": "reuniao" 
    }
  },
  "projecoes_px": {
    "IPCA": {
      "2025-01": { "mom": 0.5, "a12": 4.2 },
      "2025-02": { "mom": 0.4, "a12": 4.1 }
    },
    "SELIC": {
      "2025-01": { "valor": 12.25 }
    }
  },
  "projecoes_mercado": {
    "IPCA": {
      "2025-01": { "mom": 0.48, "a12": 4.15 }
    }
  },
  "projecoes_anuais_px": {
    "IPCA": { "2025": 4.0, "2026": 3.8 },
    "PIB": { "2025": 2.5, "2026": 2.0 }
  },
  "projecoes_anuais_mercado": {
    "IPCA": { "2025": 4.1, "2026": 3.9 }
  }
}
```

---

## 🔧 Como Usar

### 1. Configurar paths

Edite `config.R` com seus caminhos locais:

```r
# config.R
OUTPUT_DIR <- "C:/Users/Lucas/Desktop/PX2/frontend/public/data"
INPUT_DIR <- "C:/Users/Lucas/Desktop/reports PX/all data"
```

### 2. Rodar script individual

```r
source("scripts/R/ipca_update.R")
```

### 3. Rodar todos

```r
source("scripts/R/run_all.R")
```

### 4. Via PowerShell (para automação)

```powershell
Rscript "C:\Users\Lucas\Desktop\PX2\scripts\R\run_all.R"
```

---

## 🚀 Deploy

Após atualizar os JSONs:

```powershell
cd C:\Users\Lucas\Desktop\PX2
git add frontend/public/data/*.json
git commit -m "data: atualiza dados IPCA"
git push origin main
```

O Vercel faz deploy automático após o push.

---

## ⚠️ Regras Importantes

1. **Formato de data**: Sempre "YYYY-MM-DD"
   - IPCA: dia 01 (ex: "2025-10-01")
   - IPCA-15: dia 15 (ex: "2025-10-15")

2. **Valores nulos**: Usar `null` no JSON (não `NA` ou `NaN`)

3. **Encoding**: Salvar como UTF-8

4. **Decimais**: Usar ponto (.) não vírgula

5. **Ordem**: Dados em ordem cronológica crescente

---

## 📝 Checklist de Atualização

- [ ] Atualizar dados fonte (Excel/API)
- [ ] Rodar script R correspondente
- [ ] Verificar JSON gerado (abrir no browser)
- [ ] Git add + commit + push
- [ ] Verificar deploy no Vercel

