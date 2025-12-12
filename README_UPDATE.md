# 📊 PX Economics - Guia de Atualização

Este guia explica como atualizar dados existentes e adicionar novos indicadores ao site PX Economics.

## 📑 Índice

1. [Atualizar Dados Existentes](#1-atualizar-dados-existentes)
2. [Adicionar Novos Indicadores](#2-adicionar-novos-indicadores)
3. [Deploy no Vercel](#3-deploy-no-vercel)

---

## 1. 📥 Atualizar Dados Existentes

### IPCA e IPCA-15

#### Passo 1: Atualizar os arquivos Excel

Atualize os arquivos fonte com os novos dados:

- **IPCA:**
  - `C:\Users\Lucas\Desktop\reports PX\all data\IPCA\nucleos_ipca_completo.xlsx`
  - `C:\Users\Lucas\Desktop\reports PX\all data\IPCA\difusao_IPCA.xlsx`

- **IPCA-15:**
  - `C:\Users\Lucas\Desktop\reports PX\all data\IPCA 15\IPCA15_nucleos.xlsx`
  - `C:\Users\Lucas\Desktop\reports PX\all data\IPCA 15\IPCA15_Difusao.xlsx`

#### Passo 2: Executar o script de conversão

**Opção A: Python (Recomendado)**

```powershell
# Ativar ambiente virtual
cd C:\Users\Lucas\Desktop\PX2
.\venv\Scripts\activate

# Atualizar IPCA
python scripts\convert_ipca_to_json.py

# Atualizar IPCA-15
python scripts\convert_ipca15_to_json.py
```

**Opção B: R**

```powershell
# Navegar para a pasta de scripts R
cd C:\Users\Lucas\Desktop\PX2\scripts\R

# Atualizar IPCA
Rscript ipca_update.R

# Atualizar IPCA-15
Rscript ipca15_update.R

# Ou atualizar todos de uma vez
Rscript run_all.R
```

#### Passo 3: Verificar a atualização

Confira se o JSON foi atualizado:

```powershell
# Ver últimas linhas do arquivo
Get-Content frontend\public\data\ipca.json -Tail 20
```

O script mostrará:
- ✅ Número de linhas processadas
- ✅ Última data disponível
- ✅ Último valor do indicador

#### Passo 4: Commit e Push

```powershell
# Adicionar e commitar
git add frontend/public/data/ipca.json
git commit -m "chore: update IPCA data - [MÊS/ANO]"

# Push para GitHub
git push origin main
```

---

## 2. ➕ Adicionar Novos Indicadores

### Estrutura do JSON

Os indicadores devem seguir este formato:

```json
{
  "mom": [
    {
      "data_date": "2024-01-01",
      "Indicador_1": 0.5,
      "Indicador_2": 1.2
    }
  ],
  "a12": [
    {
      "data_date": "2024-01-01",
      "Indicador_1": 4.5,
      "Indicador_2": 5.8
    }
  ],
  "metadata": {
    "indicator": "Nome do Indicador",
    "description": "Descrição completa",
    "source": "Fonte dos dados",
    "last_updated": "2024-12-10T14:30:00",
    "frequency": "monthly"
  }
}
```

### Passo 1: Preparar os dados

1. Organize seus dados em Excel com as seguintes sheets:
   - `MoM` - Variação mensal
   - `Acumulado_12m` - Acumulado 12 meses
   - `Pesos` - Pesos (se aplicável)

2. A primeira coluna deve ser `Data` ou `data_date` no formato de data

### Passo 2: Criar script de conversão

Use o template em `scripts/R/TEMPLATE_novo_indicador.R`:

```r
# Copiar template
cp scripts/R/TEMPLATE_novo_indicador.R scripts/R/meu_indicador_update.R

# Editar e configurar:
# - Caminho do arquivo Excel
# - Nome das sheets
# - Caminho de saída
```

Ou crie um script Python baseado em `scripts/convert_ipca_to_json.py`.

### Passo 3: Gerar o JSON

```powershell
# Com R
Rscript scripts\R\meu_indicador_update.R

# Com Python
python scripts\meu_indicador_converter.py
```

O arquivo será salvo em: `frontend/public/data/[nome_indicador].json`

### Passo 4: Criar página do indicador

Crie uma nova página em `frontend/src/app/indicators/[nome]/page.tsx`:

```typescript
// frontend/src/app/indicators/meu-indicador/page.tsx
import { InflationChart } from '@/components/InflationChart';

export default async function MeuIndicadorPage() {
  // Carregar dados do JSON
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/data/meu_indicador.json`,
    { cache: 'no-store' }
  );
  const data = await response.json();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Meu Indicador</h1>
      
      <InflationChart 
        data={data}
        title="Meu Indicador"
        description={data.metadata?.description}
      />
    </div>
  );
}
```

### Passo 5: Adicionar ao menu (opcional)

Edite `frontend/src/components/Header.tsx` para adicionar link no menu.

### Passo 6: Testar localmente

```powershell
cd frontend
npm run dev
```

Acesse: `http://localhost:3000/indicators/meu-indicador`

### Passo 7: Commit e Deploy

```powershell
# Adicionar todos os arquivos
git add frontend/public/data/meu_indicador.json
git add frontend/src/app/indicators/meu-indicador/
git add scripts/meu_indicador_update.R  # se criou script

# Commit
git commit -m "feat: add [Nome do Indicador] indicator"

# Push
git push origin main
```

---

## 3. 🚀 Deploy no Vercel

### Opção A: Deploy Automático (Recomendado)

1. **Conectar GitHub ao Vercel:**
   - Acesse: https://vercel.com/peixonaut01s-projects/px-2/settings/git
   - Clique em "Connect Git Repository"
   - Selecione: `peixonaut01-boop/PX2`
   - Configure Root Directory: `frontend`

2. **Fazer Push:**
   ```powershell
   git push origin main
   ```

3. **Aguardar Deploy:**
   - O Vercel detecta automaticamente o push
   - Deploy acontece em ~2-3 minutos
   - Confira em: https://vercel.com/peixonaut01s-projects/px-2

### Opção B: Deploy Manual via CLI

```powershell
# Instalar Vercel CLI (se não tiver)
npm install -g vercel

# Login no Vercel
vercel login

# Deploy para produção
cd frontend
vercel --prod
```

### Opção C: Deploy Manual via Dashboard

1. Acesse: https://vercel.com/peixonaut01s-projects/px-2
2. Clique no último deployment
3. Clique em "Redeploy"
4. Confirme

---

## 📋 Checklist de Atualização Completa

### Para IPCA/IPCA-15:

- [ ] Atualizar arquivo Excel com novos dados
- [ ] Executar script de conversão (Python ou R)
- [ ] Verificar JSON gerado
- [ ] Commit com mensagem descritiva
- [ ] Push para GitHub
- [ ] Verificar deploy no Vercel
- [ ] Testar no site em produção

### Para Novo Indicador:

- [ ] Preparar dados em Excel
- [ ] Criar/adaptar script de conversão
- [ ] Gerar JSON em `frontend/public/data/`
- [ ] Criar página do indicador
- [ ] Testar localmente (`npm run dev`)
- [ ] Commit todos os arquivos
- [ ] Push para GitHub
- [ ] Verificar deploy no Vercel
- [ ] Testar no site em produção

---

## 🛠️ Troubleshooting

### Erro: "File not found" no script

**Solução:** Verifique se o caminho do arquivo Excel está correto no script.

```r
# Em scripts/R/config.R
IPCA_DIR <- file.path(INPUT_DIR, "IPCA")
IPCA_NUCLEOS_FILE <- file.path(IPCA_DIR, "nucleos_ipca_completo.xlsx")
```

### Erro: JSON vazio ou com NaN

**Solução:** Verifique se as sheets do Excel têm os nomes corretos:
- `MoM`
- `Acumulado_12m`
- `Pesos`

### Vercel não detecta mudanças

**Soluções:**
1. Verifique se Git integration está conectada
2. Force um deploy com commit vazio:
   ```powershell
   git commit --allow-empty -m "chore: trigger deploy"
   git push origin main
   ```

### Site não mostra dados atualizados

**Soluções:**
1. Limpar cache do navegador (Ctrl + Shift + R)
2. Verificar se o deploy foi bem-sucedido no Vercel
3. Aguardar alguns minutos para propagação

---

## 📞 Estrutura de Arquivos Importante

```
PX2/
├── frontend/
│   ├── public/
│   │   └── data/              # ← JSONs dos indicadores aqui
│   │       ├── ipca.json
│   │       ├── ipca15.json
│   │       └── projecoes.json
│   ├── src/
│   │   └── app/
│   │       └── indicators/    # ← Páginas dos indicadores aqui
│   │           ├── ipca/
│   │           └── ipca15/
│   └── package.json
├── scripts/
│   ├── R/                     # Scripts R de atualização
│   │   ├── config.R          # Configurações de paths
│   │   ├── ipca_update.R
│   │   └── ipca15_update.R
│   ├── convert_ipca_to_json.py
│   └── convert_ipca15_to_json.py
└── data/                      # Catálogos de séries (local)
    ├── processed/
    └── raw/
```

---

## 🎯 Comandos Rápidos

```powershell
# Atualizar IPCA
.\venv\Scripts\activate
python scripts\convert_ipca_to_json.py
git add frontend/public/data/ipca.json
git commit -m "chore: update IPCA data"
git push origin main

# Atualizar IPCA-15
python scripts\convert_ipca15_to_json.py
git add frontend/public/data/ipca15.json
git commit -m "chore: update IPCA-15 data"
git push origin main

# Ver status do site
cd frontend
npm run dev
# Acessar: http://localhost:3000
```

---

**Última atualização:** Dezembro 2024  
**Autor:** PX Economics Team

