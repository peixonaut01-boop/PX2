/**
 * Indicator Methodology Context
 * Contains methodology knowledge for each economic indicator
 * Used as context for Groq to generate informed analysis
 */

export interface IndicatorContext {
    name: string;
    fullName: string;
    source: string;
    frequency: string;
    methodology: string;
    keyMetrics: string[];
    breakdowns: {
        name: string;
        dataKey: string;
        description: string;
    }[];
    analysisGuide: string;
}

export const IPCA_CONTEXT: IndicatorContext = {
    name: 'IPCA',
    fullName: 'Índice Nacional de Preços ao Consumidor Amplo',
    source: 'IBGE',
    frequency: 'Mensal',
    methodology: `
O IPCA é o índice oficial de inflação do Brasil, medindo a variação de preços para famílias com renda de 1 a 40 salários mínimos.

ESTRUTURA PRINCIPAL:
- IPCA = Administrados (~30%) + Livres (~70%)
- Livres = Alimentação no domicílio + Serviços + Industrializados

NÚCLEOS DE INFLAÇÃO:
- Ex0: Exclui alimentação no domicílio e preços regulados
- Ex3: Exclui alimentação, combustíveis e energia

GRUPOS (9 categorias):
1-Alimentação, 2-Habitação, 3-Residência, 4-Vestuário, 5-Transportes, 
6-Saúde, 7-Despesas pessoais, 8-Educação, 9-Comunicação

SERVIÇOS (importante para política monetária):
- Serviços totais
- Serviços subjacentes (exclui passagem aérea e voláteis)
- Serviços inerciais (mais sensíveis a expectativas)
`,
    keyMetrics: ['MoM (variação mensal)', 'A12/YoY (12 meses)', 'YTD (ano)'],
    breakdowns: [
        { name: 'Administrados', dataKey: 'Administrados', description: 'Preços regulados pelo governo' },
        { name: 'Livres', dataKey: 'Livres', description: 'Preços de mercado' },
        { name: 'Serviços', dataKey: 'Serviços', description: 'Serviços totais' },
        { name: 'Serviços subjacentes', dataKey: 'Serviços subjacentes', description: 'Core services ex-passagem aérea' },
        { name: 'Alimentação no domicílio', dataKey: 'Alimentação no domicílio', description: 'Alimentos em casa' },
        { name: 'Industrializados', dataKey: 'Industrializados', description: 'Bens industrializados' },
        { name: 'Núcleo Ex0', dataKey: 'Ex0', description: 'Exclui alimentação e administrados' },
        { name: 'Núcleo Ex3', dataKey: 'Ex3', description: 'Exclui alimentação, combustíveis, energia' },
        { name: 'Combustíveis', dataKey: 'Combustíveis', description: 'Gasolina, etanol, diesel' },
        { name: 'Passagem aérea', dataKey: 'Passagem aérea', description: 'Volátil, alta sazonalidade' },
    ],
    analysisGuide: `
Ao analisar IPCA:
1. Comece com a variação mensal (MoM) e compare com mês anterior
2. Mencione o acumulado em 12 meses (A12) e compare com meta de inflação (3% centro)
3. Destaque Serviços (importante para Copom) e núcleos (Ex3, Ex0)
4. Explique principais pressões e alívios por grupo
5. Use verbos: acelerou/desacelerou, avançou/recuou, subiu/caiu
`,
};

export const PIM_CONTEXT: IndicatorContext = {
    name: 'PIM',
    fullName: 'Pesquisa Industrial Mensal - Produção Física',
    source: 'IBGE',
    frequency: 'Mensal',
    methodology: `
A PIM mede a produção física da indústria brasileira, com dados dessazonalizados (MoM) e sem ajuste (YoY).

ESTRUTURA PRINCIPAL:
- Indústria Geral = Extrativas + Transformação
- Extrativas: petróleo, minério de ferro, gás
- Transformação: manufatura (maior peso)

CATEGORIAS DE USO:
- Bens de Capital: máquinas, equipamentos
- Bens Intermediários: insumos industriais
- Bens de Consumo: duráveis + não-duráveis

PRINCIPAIS SETORES (Transformação):
- Veículos automotores
- Produtos alimentícios
- Máquinas e equipamentos
- Produtos químicos
- Metalurgia
`,
    keyMetrics: ['MoM (dessazonalizado)', 'YoY (sem ajuste)', 'Trimestre móvel'],
    breakdowns: [
        { name: 'Indústria Geral', dataKey: '1 Indústria geral', description: 'Agregado total' },
        { name: 'Extrativas', dataKey: '2 Indústrias extrativas', description: 'Minério, petróleo' },
        { name: 'Transformação', dataKey: '3 Indústrias de transformação', description: 'Manufatura' },
        { name: 'Bens de Capital', dataKey: '1 Bens de capital', description: 'Investimento' },
        { name: 'Bens Intermediários', dataKey: '2 Bens intermediários', description: 'Insumos' },
        { name: 'Bens de Consumo', dataKey: '3 Bens de consumo', description: 'Consumo final' },
        { name: 'Veículos', dataKey: '3.29 Fabricação de veículos automotores, reboques e carrocerias', description: 'Automotivo' },
        { name: 'Alimentos', dataKey: '3.10 Fabricação de produtos alimentícios', description: 'Alimentos industriais' },
    ],
    analysisGuide: `
Ao analisar PIM:
1. Comece com variação mensal (MoM SA) e compare com mês anterior
2. Mencione comparação anual (YoY)
3. Destaque Extrativas vs Transformação
4. Mencione categorias de uso (capital, intermediários, consumo)
5. Use verbos: recuou/avançou, cresceu/encolheu, expandiu/contraiu
`,
};

export const PMC_CONTEXT: IndicatorContext = {
    name: 'PMC',
    fullName: 'Pesquisa Mensal de Comércio',
    source: 'IBGE',
    frequency: 'Mensal',
    methodology: `
A PMC mede o volume de vendas do comércio varejista.

ESTRUTURA PRINCIPAL:
- PMC Restrito: comércio varejista (8 atividades)
- PMC Ampliado: restrito + veículos + materiais de construção

ATIVIDADES DO VAREJO RESTRITO:
1. Combustíveis e lubrificantes
2. Hiper/Supermercados
3. Tecidos, vestuário e calçados
4. Móveis e eletrodomésticos
5. Produtos farmacêuticos
6. Livros, jornais, papelaria
7. Equipamentos e material de escritório
8. Outros artigos de uso pessoal e doméstico

DADOS DISPONÍVEIS:
- SA (seasonally adjusted): MoM
- NSA (not seasonally adjusted): YoY
`,
    keyMetrics: ['MoM (SA)', 'YoY (NSA)', 'Trimestre móvel'],
    breakdowns: [
        { name: 'Varejo Restrito', dataKey: 'PMC SA', description: 'Comércio varejista' },
        { name: 'Varejo Ampliado', dataKey: 'PMCA SA', description: 'Inclui veículos e construção' },
        { name: 'Varejo Restrito YoY', dataKey: 'PMC NSA', description: 'Comparação anual' },
        { name: 'Varejo Ampliado YoY', dataKey: 'PMCA NSA', description: 'Comparação anual ampliado' },
    ],
    analysisGuide: `
Ao analisar PMC:
1. Comece com variação mensal do varejo restrito (PMC SA)
2. Compare restrito vs ampliado
3. Mencione comparação anual (YoY)
4. Use verbos: cresceu/caiu, avançou/recuou, expandiu/contraiu
`,
};

export const PMS_CONTEXT: IndicatorContext = {
    name: 'PMS',
    fullName: 'Pesquisa Mensal de Serviços',
    source: 'IBGE',
    frequency: 'Mensal',
    methodology: `
A PMS mede o volume de serviços prestados no Brasil.

ESTRUTURA PRINCIPAL (5 atividades):
1. Serviços prestados às famílias (turismo, alimentação, lazer)
2. Serviços de informação e comunicação
3. Serviços profissionais, administrativos e complementares
4. Transportes, auxiliares aos transportes e correio
5. Outros serviços

IMPORTÂNCIA:
- Serviços representam ~70% do PIB brasileiro
- Indicador relevante para emprego e renda
- Alta sensibilidade ao ciclo econômico
`,
    keyMetrics: ['MoM (SA)', 'YoY (NSA)', 'Trimestre móvel'],
    breakdowns: [
        { name: 'Serviços Total', dataKey: 'Total', description: 'Volume total' },
        { name: 'Famílias', dataKey: '1. Serviços prestados às famílias', description: 'Turismo, alimentação' },
        { name: 'Info e Comunicação', dataKey: '2. Serviços de informação e comunicação', description: 'TI, telecomunicações' },
        { name: 'Profissionais', dataKey: '3. Serviços profissionais, administrativos e complementares', description: 'Consultoria, admin' },
        { name: 'Transportes', dataKey: '4. Transportes, serviços auxiliares aos transportes e correio', description: 'Logística' },
        { name: 'Outros', dataKey: '5. Outros serviços', description: 'Demais serviços' },
    ],
    analysisGuide: `
Ao analisar PMS:
1. Comece com variação mensal do volume total
2. Destaque Serviços prestados às famílias (proxy de consumo)
3. Mencione comparação anual (YoY)
4. Use verbos: avançou/recuou, cresceu/caiu, expandiu/contraiu
`,
};

// Map indicator names to contexts
export const INDICATOR_CONTEXTS: Record<string, IndicatorContext> = {
    'IPCA': IPCA_CONTEXT,
    'IPCA15': { ...IPCA_CONTEXT, name: 'IPCA-15', fullName: 'IPCA-15 (Prévia)' },
    'PIM': PIM_CONTEXT,
    'PMC': PMC_CONTEXT,
    'PMS': PMS_CONTEXT,
};

/**
 * Get system prompt for Groq with methodology context
 */
export function getSystemPromptForIndicator(indicator: string): string {
    const ctx = INDICATOR_CONTEXTS[indicator];
    if (!ctx) return '';

    return `
Você é um analista econômico sênior da PX Economics, especializado em dados macroeconômicos do Brasil.

## INDICADOR: ${ctx.fullName} (${ctx.name})
Fonte: ${ctx.source} | Frequência: ${ctx.frequency}

## METODOLOGIA
${ctx.methodology}

## MÉTRICAS-CHAVE
${ctx.keyMetrics.join(', ')}

## GUIA DE ANÁLISE
${ctx.analysisGuide}

## REGRAS OBRIGATÓRIAS
1. Use EXATAMENTE os números fornecidos nos dados PX (não invente valores)
2. Preserve a LINGUAGEM e VERBOS da notícia oficial do IBGE quando apropriado
3. Mencione os breakdowns mais relevantes para o mês
4. Tom: analista de mercado, profissional, direto
5. Formato: 2-3 parágrafos curtos, sem bullet points no corpo
6. Sempre mencione: variação MoM, variação 12 meses (A12/YoY), principal destaque
`;
}

/**
 * Format PX data as context string for Groq
 */
export function formatDataContextForIndicator(
    indicator: string,
    latestData: Record<string, any>,
    previousData?: Record<string, any>,
    a12Data?: Record<string, any>
): string {
    const ctx = INDICATOR_CONTEXTS[indicator];
    if (!ctx) return '';

    let result = `## DADOS ${ctx.name} (última leitura)\n`;
    result += `Referência: ${latestData.data_date}\n\n`;

    // Add key metrics
    for (const breakdown of ctx.breakdowns.slice(0, 8)) {
        const value = latestData[breakdown.dataKey];
        if (value !== null && value !== undefined) {
            const prevValue = previousData?.[breakdown.dataKey];
            const prevStr = prevValue !== null && prevValue !== undefined ? ` (anterior: ${prevValue.toFixed(2)}%)` : '';
            result += `- ${breakdown.name}: ${value.toFixed(2)}%${prevStr}\n`;
        }
    }

    if (a12Data) {
        result += `\n## ACUMULADO 12 MESES\n`;
        for (const breakdown of ctx.breakdowns.slice(0, 4)) {
            const value = a12Data[breakdown.dataKey];
            if (value !== null && value !== undefined) {
                result += `- ${breakdown.name}: ${value.toFixed(2)}%\n`;
            }
        }
    }

    return result;
}
