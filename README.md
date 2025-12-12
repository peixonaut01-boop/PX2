# PX Economics

**Site:** https://pxeconomics.com.br  
**Backup URL:** https://px-2-five.vercel.app

<!-- Deploy test -->

## 🎯 Visão Geral

Plataforma de análise econômica e financeira da PX Economics, focada em Brasil, EUA e Europa. Inclui relatórios de inflação, projeções macroeconômicas, notícias e área de clientes.

---

## 🏗 Estrutura do Projeto

```
PX2/
├── frontend/                 # Next.js App (principal)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                    # Home
│   │   │   ├── indicators/
│   │   │   │   ├── page.tsx                # Lista de indicadores
│   │   │   │   ├── ipca/page.tsx           # Relatório IPCA
│   │   │   │   └── ipca15/page.tsx         # Relatório IPCA-15
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx                # Dashboard admin
│   │   │   │   ├── projecoes/page.tsx      # Central de Projeções
│   │   │   │   └── clientes/page.tsx       # Gestão de clientes
│   │   │   ├── cliente/
│   │   │   │   ├── page.tsx                # Login cliente
│   │   │   │   └── dashboard/page.tsx      # Dashboard cliente
│   │   │   ├── news/
│   │   │   │   ├── page.tsx                # Lista de notícias
│   │   │   │   └── [slug]/page.tsx         # Artigo individual
│   │   │   ├── articles/
│   │   │   │   └── [slug]/page.tsx         # Artigos (CMS)
│   │   │   └── api/
│   │   │       ├── projecoes/route.ts      # API projeções
│   │   │       ├── admin/                 # APIs admin (posts, upload)
│   │   │       ├── client/login/route.ts   # Autenticação cliente
│   │   │       ├── chat/route.ts          # Chat API
│   │   │       └── quotes/                # Cotações de mercado
│   │   ├── components/
│   │   │   ├── Header.tsx                  # Navegação principal
│   │   │   ├── Footer.tsx                 # Rodapé
│   │   │   ├── InflationChart.tsx          # Gráficos de inflação
│   │   │   ├── NewsCard.tsx                # Cards de notícias
│   │   │   ├── TickerTape.tsx              # Ticker de ações
│   │   │   ├── GlobalIndicatorsRow.tsx     # Indicadores globais
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── ibge.ts                     # Utilitários IBGE
│   │   │   ├── market.ts                   # Dados de mercado
│   │   │   ├── content.ts                  # CMS content
│   │   │   ├── supabase.ts                 # Cliente Supabase
│   │   │   └── auth.tsx                    # Autenticação
│   │   └── contexts/
│   │       └── ThemeContext.tsx            # Tema (dark/light)
│   ├── content/
│   │   └── news/                           # Notícias em Markdown
│   ├── public/
│   │   ├── data/
│   │   │   ├── ipca.json                   # Dados IPCA processados
│   │   │   ├── ipca15.json                 # Dados IPCA-15 processados
│   │   │   ├── projecoes.json              # Projeções PX e Mercado
│   │   │   └── quotes_cache.json           # Cache de cotações
│   │   └── images/                        # Imagens e assets
│   └── config.yml                          # Config Decap CMS
├── backend/                 # FastAPI Backend (Python)
│   ├── app/
│   │   ├── main.py                         # Entry point FastAPI
│   │   ├── api/
│   │   │   ├── timeseries.py               # API séries temporais
│   │   │   ├── market.py                  # API mercado
│   │   │   └── market_br.py               # API mercado Brasil
│   │   ├── services/
│   │   │   ├── data_service.py            # Serviço de dados
│   │   │   ├── tiingo_service.py           # Integração Tiingo
│   │   │   └── br_market_service.py        # Mercado Brasil
│   │   └── models/                        # Modelos de dados
│   ├── collectors/
│   │   └── get_cnt_catalog.py              # Coletor IBGE
│   ├── requirements.txt                    # Dependências Python
│   └── run.py                             # Script de execução
├── scripts/                   # Python scripts para processamento
│   ├── convert_ipca_to_json.py            # Conversão IPCA → JSON
│   ├── convert_ipca15_to_json.py          # Conversão IPCA-15 → JSON
│   ├── build_bcb_catalog.py                # Catálogo BCB
│   ├── kalshi_gdp_collector.py            # Coletor Kalshi
│   └── ...
├── data/                      # Dados brutos e processados
│   ├── raw/                                # Dados brutos
│   │   └── IBGE catalog/                   # Catálogos IBGE
│   ├── processed/                          # Dados processados (Parquet)
│   └── kalshi/                             # Dados Kalshi
├── database/                  # Dados estruturados por país
│   ├── Brasil/
│   └── EUA/
└── README.md
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Python 3.8+ (para scripts e backend)
- Supabase (para autenticação e banco de dados)

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

**CMS Local (Decap):**
```bash
npm run cms:dev
```

Acesse: http://localhost:8080/admin

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python run.py
# ou
uvicorn app.main:app --reload
```

API disponível em: http://localhost:8000  
Documentação: http://localhost:8000/docs

---

## 📊 Atualizando Dados

### IPCA / IPCA-15

**Nota:** Os scripts de conversão atualmente usam paths absolutos. Ajuste os caminhos nos scripts antes de executar.

1. Atualize os arquivos Excel (localizados externamente ou em `/data/raw/`)
2. Edite os scripts para apontar para os arquivos corretos:
   - `scripts/convert_ipca_to_json.py`
   - `scripts/convert_ipca15_to_json.py`
3. Execute os scripts:

```bash
cd scripts
python convert_ipca_to_json.py
python convert_ipca15_to_json.py
```

4. Os JSONs são gerados em `frontend/public/data/`
5. Commit e push para atualizar o site

### Projeções

Acesse: https://pxeconomics.com.br/admin/projecoes

- **Autenticação:** Senha administrativa requerida
- Aba "Projeções PX": suas projeções
- Aba "Projeções Mercado": consenso de mercado
- Views: MoM, A12, Anual
- Clique "Salvar Projeções" após editar

**Nota:** No Vercel, as projeções são salvas temporariamente. Para persistência permanente, edite `frontend/public/data/projecoes.json` diretamente e faça commit.

### Notícias (CMS)

1. Acesse http://localhost:8080/admin (modo dev) ou `/admin` (produção)
2. Use o Decap CMS para criar/editar notícias
3. Arquivos Markdown são salvos em `frontend/content/news/`
4. Commit e push para publicar

---

## 🔗 URLs Importantes

| Página | URL |
|--------|-----|
| Home | https://pxeconomics.com.br |
| IPCA | https://pxeconomics.com.br/indicators/ipca |
| IPCA-15 | https://pxeconomics.com.br/indicators/ipca15 |
| Notícias | https://pxeconomics.com.br/news |
| Admin Projeções | https://pxeconomics.com.br/admin/projecoes |
| Admin CMS | https://pxeconomics.com.br/admin |
| Área Cliente | https://pxeconomics.com.br/cliente |

---

## 🛠 Tecnologias

### Frontend
- **Framework:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **CMS:** Decap (Netlify CMS)
- **Auth:** Supabase
- **Markdown:** Remark, Rehype (com suporte a LaTeX/Katex)
- **Mercado:** Yahoo Finance 2, Tiingo API

### Backend
- **Framework:** FastAPI
- **Data:** Pandas, Polars, NumPy
- **APIs:** SeriesBR, Tiingo
- **Storage:** Parquet files

### Infraestrutura
- **Hosting:** Vercel (frontend)
- **Database:** Supabase
- **Domínio:** Registro.br (pxeconomics.com.br)

---

## 📦 Deploy

O deploy é **automático** via Vercel:

1. Push para `main` no GitHub
2. Vercel detecta e faz rebuild
3. Site atualizado em ~1 minuto

**Repositório:** https://github.com/peixonaut01/PX2

### Fluxo de trabalho combinado (dev + Vercel)
- Ajuste o código localmente.
- Faça commit e push (sem usar `&&` nos comandos).
- A Vercel detecta o push, faz o redeploy e publica.
- Valide no site após o redeploy automático.

**Variáveis de Ambiente (Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Outras variáveis conforme necessário

---

## 🎯 Features Implementadas

- [x] Relatórios IPCA e IPCA-15 com gráficos interativos
- [x] Gráficos de difusão (bruta e dessazonalizada)
- [x] Sumário executivo dinâmico
- [x] Central de Projeções (40+ indicadores BR/EUA/EUR)
- [x] Navegação com dropdown por país
- [x] Sistema de notícias/blog (CMS Decap)
- [x] Área do Cliente com autenticação (Supabase)
- [x] Ticker de ações e indicadores globais
- [x] Tema dark/light
- [x] Backend FastAPI para séries temporais
- [x] Deploy contínuo na Vercel
- [x] Domínio próprio com SSL

---

## 🚧 Próximos Passos (Backlog)

- [ ] Integrar projeções nos relatórios IPCA/IPCA-15
- [ ] Mais indicadores (PIB, Emprego, Fiscal)
- [ ] Dashboard cliente com conteúdo exclusivo
- [ ] Sistema de assinaturas
- [ ] API pública para dados históricos
- [ ] Integração com mais fontes de dados

---

## 👥 Contato

PX Economics - Análises econômicas baseadas em evidências

---

## 📝 Notas para Desenvolvedores

### Estrutura dos Dados IPCA/IPCA-15

```json
{
  "metadata": {
    "last_updated": "2024-10-15T12:00:00Z"
  },
  "mom": [
    { "data_date": "2024-10-01", "IPCA": 0.5, "Alimentacao": 0.3, ... }
  ],
  "a12": [
    { "data_date": "2024-10-01", "IPCA": 4.2, ... }
  ],
  "pesos": [
    { "data_date": "2024-10-01", "Alimentacao": 21.5, ... }
  ],
  "difusao_bruta": [
    { "data_date": "2024-10-01", "Difusao_Mensal": 65.2, "Media_Historica": 58.1 }
  ],
  "difusao_dessaz": [
    { "data_date": "2024-10-01", "Difusao_Mensal": 63.8, "Tendencia": 62.5 }
  ]
}
```

### Estrutura das Projeções

```json
{
  "metadata": {
    "last_updated": "2024-12-01T10:00:00Z",
    "updated_by": "admin"
  },
  "indicadores": {
    "IPCA": {
      "nome": "IPCA",
      "unidade": "% m/m",
      "categoria": "Inflação",
      "tipo": "mom"
    }
  },
  "projecoes_px": {
    "IPCA": {
      "2025-01": { "mom": 0.5, "a12": 4.2 },
      "2025-02": { "mom": 0.4, "a12": 4.1 }
    }
  },
  "projecoes_mercado": { ... },
  "projecoes_anuais_px": {
    "IPCA": {
      "2025": 4.0,
      "2026": 3.8
    }
  },
  "projecoes_anuais_mercado": { ... }
}
```

### Componentes Principais

- `Header.tsx`: Navegação com dropdown para Brasil > IPCA/IPCA-15
- `InflationChart.tsx`: Gráficos de linha/barra para inflação
- `DiffusionChart.tsx`: Gráficos específicos de difusão
- `NewsCard.tsx`: Cards de notícias
- `TickerTape.tsx`: Ticker de ações em tempo real
- `GlobalIndicatorsRow.tsx`: Indicadores macro globais

### APIs Backend

- `/api/timeseries`: Séries temporais de dados econômicos
- `/api/market`: Dados de mercado (EUA)
- `/api/market_br`: Dados de mercado (Brasil)

### Autenticação

- **Admin:** Senha hardcoded (ver `frontend/src/app/admin/projecoes/page.tsx`)
- **Cliente:** Supabase Auth (email/password)
- **Sessões:** LocalStorage para admin, Supabase sessions para clientes

---

*Última atualização: Janeiro 2025*
