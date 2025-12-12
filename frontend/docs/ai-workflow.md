# Fluxo Editorial com IA

Documento vivo para orientar quando e como acionar a IA, quais dados fornecer e como garantir o tom "Brasil Independente": jornal de grande circulação, independente, apolítico, baseado em dados públicos.

---

## 1. Gatilho: Eventos econômicos do dia

- **Checklist diário de fontes**: BCB (Copom, ata, boletins), Tesouro, IBGE, Ipea, Receita, Fazenda, releases de estatais, agências internacionais (FMI, BID, OCDE), agendas corporativas relevantes.
- **Critério editorial**: impacto macro relevante ou efeito direto em política pública/mercado amplo; evitar tecnicismos proprietários exceto quando em editorial.

### Pipeline
1. **Monitorar** agenda e feeds RSS/notas oficiais.
2. **Capturar o fato** em até 5 linhas com data/hora, órgão emissor, indicador publicado e número principal.
3. **Contextualizar** com:
   - Variação vs período anterior (YoY/ QoQ)
   - Consenso de mercado (se houver)
   - Três fatores de impacto (inflação, atividade, fiscal, externo etc.)
4. **Alimentar a IA** com o pacote abaixo.

### Template de prompt (eventos)
```
Você é um jornalista do Brasil Independente. Escreva uma matéria de ampla circulação, apolítica, baseada em dados públicos. 
Fato a cobrir:
- Indicador/evento: {{evento}}
- Fonte oficial: {{fonte}}
- Data/hora: {{data}}
- Números principais: {{dados_chave}}
- Variação vs período anterior: {{variacao}}
- Expectativa do mercado (se disponível): {{consenso}}
- Principais impactos: {{impactos}}

Estruture a matéria com:
1. Título direto (máx. 90 caracteres)
2. Subtítulo sintetizando o impacto
3. Corpo em 4-5 parágrafos (~120 palavras cada) com:
   - Contexto inicial do fato
   - Comparação histórica ou regional
   - Reações de mercado ou atores relevantes
   - Possíveis próximos passos/políticas
Evite jargões proprietários; cite modelos apenas se já públicos.
```

---

## 2. Gatilho: Calls editoriais do Lucas

- **Entrada mínima**: tema/ângulo, objetivo (explicar, investigar, editorial), prazo, links/base de dados autorizados.
- **Confirmação rápida**: responder com estrutura proposta (Título, Subtítulo, 3 bullets de linha narrativa, dados necessários).
- **Produção**: após aval, rodar prompt abaixo com o pacote informado.

### Template de prompt (call editorial)
```
Você é jornalista do Brasil Independente. Produza uma matéria com a estrutura abaixo:
- Tema central: {{tema}}
- Ângulo definido pelo editor: {{angulo}}
- Dados/links autorizados: {{fontes}}
- Objetivo: {{objetivo}}

Formato:
1. Título e subtítulo (tom independente, amplo, sem jargão técnico proprietário).
2. Corpo dividido em:
   a. Contexto e relevância nacional
   b. Dados e evidências (com números públicos)
   c. Implicações e próximos passos
3. Conclusão curta ressaltando a independência editorial.

Evite adjetivos opinativos; cite metodologias apenas quando públicas ou já divulgadas pelo autor.
```

---

## 3. Checklist antes de publicar

- [ ] Fontes confirmadas e públicas
- [ ] Ausência de termos partidários ou alinhamentos políticos
- [ ] Dados formatados com unidades e períodos
- [ ] Revisão humana final (Lucas) antes de entrar no CMS
- [ ] Registrar data/hora e link das fontes para auditoria

