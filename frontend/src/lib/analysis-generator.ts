/**
 * Enhanced Analysis Generator with IBGE News Fusion
 * Merges official IBGE news text with PX data using Groq
 */

import ipcaData from '../../public/data/ipca.json';
import ipca15Data from '../../public/data/ipca15.json';
import pmcData from '../../public/data/pmc.json';
import pmsData from '../../public/data/pms.json';
import pimData from '../../public/data/pim.json';
import {
    getSystemPromptForIndicator,
    formatDataContextForIndicator,
    INDICATOR_CONTEXTS
} from './indicator-context';
import { getLatestNewsForIndicator, IndicatorNews } from './rss-parser';

// Lazy Groq client initialization
let groqClient: any = null;

async function getGroqClient() {
    if (!process.env.GROQ_API_KEY) {
        return null;
    }
    if (!groqClient) {
        const Groq = (await import('groq-sdk')).default;
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

export type IndicatorType = 'IPCA' | 'IPCA15' | 'PMC' | 'PMS' | 'PIM';

export interface FlashReport {
    id: string;
    indicator: IndicatorType;
    reference_date: string;
    headline: string;
    metrics: Record<string, number | null>;
    analysis: string;
    chart_data: ChartDataPoint[];
    link: string;
    source_title: string | null;
    source_url: string | null;
    generated_at: string;
}

export interface ChartDataPoint {
    date: string;
    value: number;
}

interface DataRow {
    data_date: string;
    [key: string]: any;
}

function formatShortDate(isoDate: string): string {
    const date = new Date(isoDate + 'T12:00:00');
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
}

function formatMonthYear(isoDate: string): string {
    const date = new Date(isoDate + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return 'N/D';
    return num.toFixed(2).replace('.', ',');
}

function getDirectionVerb(current: number, previous: number): string {
    if (current > previous) return 'acelerou';
    if (current < previous) return 'desacelerou';
    return 'manteve-se estável';
}

/**
 * Generate template-based analysis (fallback when Groq unavailable)
 * Style: Sumário Executivo - detailed narrative with breakdowns
 */
function generateTemplateAnalysis(
    indicator: IndicatorType,
    latestMom: Record<string, any>,
    previousMom: Record<string, any>,
    latestYoy: Record<string, any>,
    referenceDate: string,
    ibgeNews: IndicatorNews | null
): { headline: string; analysis: string } {
    const refDate = formatMonthYear(referenceDate);
    const refDatePrev = previousMom?.data_date ? formatMonthYear(previousMom.data_date) : 'mês anterior';

    switch (indicator) {
        case 'IPCA':
        case 'IPCA15': {
            const ipca = latestMom['IPCA'] ?? latestMom['IPCA-15'] ?? 0;
            const ipcaPrev = previousMom?.['IPCA'] ?? previousMom?.['IPCA-15'] ?? 0;
            const a12 = latestYoy['IPCA'] ?? latestYoy['IPCA-15'] ?? 0;
            const delta = ipca - ipcaPrev;

            // Breakdowns
            const livres = latestMom['Livres'] ?? 0;
            const administrados = latestMom['Administrados'] ?? 0;
            const servicos = latestMom['Serviços'] ?? 0;
            const servicosA12 = latestYoy['Serviços'] ?? 0;
            const alimentacao = latestMom['Alimentação no domicílio'] ?? 0;
            const industrializados = latestMom['Industrializados'] ?? 0;
            const ex0 = latestMom['Ex0'] ?? 0;
            const ex3 = latestMom['Ex3'] ?? 0;
            const ex0A12 = latestYoy['Ex0'] ?? 0;
            const ex3A12 = latestYoy['Ex3'] ?? 0;

            const verb = getDirectionVerb(ipca, ipcaPrev);
            const deltaStr = delta >= 0 ? `+${formatNumber(delta)}` : formatNumber(delta);

            return {
                headline: `IPCA ${verb} para ${formatNumber(ipca)}% em ${refDate}`,
                analysis: `O IPCA de ${refDate} ${ipca >= 0 ? 'registrou alta' : 'apresentou queda'} de ${formatNumber(ipca)}% (${delta !== 0 ? deltaStr + ' p.p. vs mês anterior' : 'estável'}), acumulando ${formatNumber(a12)}% em 12 meses. Na composição, os preços livres variaram ${formatNumber(livres)}% e os administrados ${formatNumber(administrados)}%. Dentro dos livres, a alimentação no domicílio ${alimentacao >= 0 ? 'subiu' : 'caiu'} ${formatNumber(Math.abs(alimentacao))}%, enquanto industrializados variaram ${formatNumber(industrializados)}%. Os serviços registraram ${formatNumber(servicos)}% no mês (${formatNumber(servicosA12)}% em 12m). Os núcleos de inflação apresentaram Ex0 em ${formatNumber(ex0)}% (${formatNumber(ex0A12)}% em 12m) e Ex3 em ${formatNumber(ex3)}% (${formatNumber(ex3A12)}% em 12m), sinalizando ${ex3A12 > 4.5 ? 'pressão inflacionária subjacente' : ex3A12 < 3.0 ? 'inflação subjacente controlada' : 'dinâmica inflacionária dentro do esperado'}.`
            };
        }
        case 'PIM': {
            const total = latestMom['1 Indústria geral'] ?? 0;
            const totalPrev = previousMom?.['1 Indústria geral'] ?? 0;
            const yoy = latestYoy['1 Indústria geral'] ?? 0;
            const delta = total - totalPrev;

            // Breakdowns
            const extrativa = latestMom['2 Indústrias extrativas'] ?? 0;
            const transf = latestMom['3 Indústrias de transformação'] ?? 0;
            const extrativaYoy = latestYoy['2 Indústrias extrativas'] ?? 0;
            const transfYoy = latestYoy['3 Indústrias de transformação'] ?? 0;
            const bensCapital = latestMom['1 Bens de capital'] ?? 0;
            const bensInterm = latestMom['2 Bens intermediários'] ?? 0;
            const bensConsumo = latestMom['3 Bens de consumo'] ?? 0;

            const verb = getDirectionVerb(total, totalPrev);
            const deltaStr = delta >= 0 ? `+${formatNumber(delta)}` : formatNumber(delta);

            return {
                headline: `Produção industrial ${verb} ${formatNumber(total)}% em ${refDate}`,
                analysis: `A produção industrial brasileira ${verb} ${formatNumber(total)}% em ${refDate} (${delta !== 0 ? deltaStr + ' p.p. vs mês anterior' : 'estável'}). Na comparação interanual, o setor registra variação de ${formatNumber(yoy)}%. Por setores, a indústria extrativa variou ${formatNumber(extrativa)}% no mês (${formatNumber(extrativaYoy)}% interanual), enquanto a transformação apresentou ${formatNumber(transf)}% (${formatNumber(transfYoy)}% interanual). Por categorias de uso, bens de capital variaram ${formatNumber(bensCapital)}%, intermediários ${formatNumber(bensInterm)}% e bens de consumo ${formatNumber(bensConsumo)}%.`
            };
        }
        case 'PMC': {
            const restrito = latestMom['PMC SA'] ?? 0;
            const restritoPrev = previousMom?.['PMC SA'] ?? 0;
            const ampliado = latestMom['PMCA SA'] ?? 0;
            const yoy = latestYoy['PMC NSA'] ?? 0;
            const yoyAmpliado = latestYoy['PMCA NSA'] ?? 0;
            const delta = restrito - restritoPrev;

            // Sector breakdowns
            const supermercados = latestMom['Hipermercados, supermercados, produtos alimentícios, bebidas e fumo'] ?? 0;
            const combustiveis = latestMom['Combustíveis e lubrificantes'] ?? 0;
            const vestuario = latestMom['Tecidos, vestuário e calçados'] ?? 0;
            const moveis = latestMom['Móveis e eletrodomésticos'] ?? 0;

            const verb = getDirectionVerb(restrito, restritoPrev);
            const deltaStr = delta >= 0 ? `+${formatNumber(delta)}` : formatNumber(delta);

            return {
                headline: `Varejo ${verb} ${formatNumber(restrito)}% em ${refDate}`,
                analysis: `O volume de vendas do varejo ${verb} ${formatNumber(restrito)}% em ${refDate} (${delta !== 0 ? deltaStr + ' p.p. vs mês anterior' : 'estável'}). O varejo ampliado registrou variação de ${formatNumber(ampliado)}%. Na comparação interanual, o varejo restrito apresenta ${formatNumber(yoy)}% e o ampliado ${formatNumber(yoyAmpliado)}%. Por segmentos, supermercados variaram ${formatNumber(supermercados)}%, combustíveis ${formatNumber(combustiveis)}%, vestuário ${formatNumber(vestuario)}% e móveis/eletro ${formatNumber(moveis)}%.`
            };
        }
        case 'PMS': {
            const total = latestMom['Total'] ?? 0;
            const totalPrev = previousMom?.['Total'] ?? 0;
            const yoy = latestYoy['Total'] ?? 0;
            const delta = total - totalPrev;

            // Activity breakdowns
            const familias = latestMom['1. Serviços prestados às famílias'] ?? 0;
            const infoCom = latestMom['2. Serviços de informação e comunicação'] ?? 0;
            const profissionais = latestMom['3. Serviços profissionais, administrativos e complementares'] ?? 0;
            const transportes = latestMom['4. Transportes, serviços auxiliares aos transportes e correio'] ?? 0;

            const verb = getDirectionVerb(total, totalPrev);
            const deltaStr = delta >= 0 ? `+${formatNumber(delta)}` : formatNumber(delta);

            return {
                headline: `Serviços ${verb} ${formatNumber(total)}% em ${refDate}`,
                analysis: `O volume de serviços ${verb} ${formatNumber(total)}% em ${refDate} (${delta !== 0 ? deltaStr + ' p.p. vs mês anterior' : 'estável'}). Na comparação interanual, o setor apresenta variação de ${formatNumber(yoy)}%. Por atividades, serviços às famílias variaram ${formatNumber(familias)}%, informação e comunicação ${formatNumber(infoCom)}%, serviços profissionais ${formatNumber(profissionais)}% e transportes ${formatNumber(transportes)}%.`
            };
        }
        default:
            return {
                headline: `${indicator} - ${refDate}`,
                analysis: 'Análise não disponível.'
            };
    }
}

/**
 * Generate analysis using Groq with methodology context and IBGE news
 */
async function generateGroqAnalysis(
    indicator: IndicatorType,
    pxDataContext: string,
    ibgeNews: IndicatorNews | null,
    referenceDate: string,
    latestMom: Record<string, any>,
    previousMom: Record<string, any>,
    latestYoy: Record<string, any>
): Promise<{ headline: string; analysis: string }> {
    const groq = await getGroqClient();

    // Fallback to template if Groq unavailable
    if (!groq) {
        console.log('Groq unavailable, using template analysis');
        return generateTemplateAnalysis(indicator, latestMom, previousMom, latestYoy, referenceDate, ibgeNews);
    }

    const systemPrompt = getSystemPromptForIndicator(indicator);

    let userPrompt = `## DADOS PX ECONOMICS\n${pxDataContext}\n\n`;

    if (ibgeNews) {
        userPrompt += `## NOTÍCIA OFICIAL IBGE\nTítulo: ${ibgeNews.title}\nTexto: ${ibgeNews.fullText || ibgeNews.summary}\n\n`;
    }

    userPrompt += `## TAREFA
Gere uma análise profissional do ${indicator} para ${formatMonthYear(referenceDate)}.

Formato da resposta (JSON):
{
  "headline": "Título conciso da análise (max 80 caracteres)",
  "analysis": "2-3 parágrafos de análise profissional"
}`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content || '';
        const parsed = JSON.parse(responseText);

        return {
            headline: parsed.headline || `${indicator} - ${formatMonthYear(referenceDate)}`,
            analysis: parsed.analysis || 'Análise não disponível.'
        };
    } catch (error) {
        console.error(`Groq error for ${indicator}:`, error);
        // Fallback to template-based analysis
        return generateTemplateAnalysis(indicator, latestMom, previousMom, latestYoy, referenceDate, ibgeNews);
    }
}

/**
 * Extract metrics from PX data
 */
function extractMetrics(
    indicator: IndicatorType,
    latestMom: Record<string, any>,
    latestYoy: Record<string, any>
): Record<string, number | null> {
    switch (indicator) {
        case 'IPCA':
        case 'IPCA15':
            return {
                mom: latestMom['IPCA'] ?? latestMom['IPCA-15'] ?? null,
                yoy: latestYoy['IPCA'] ?? latestYoy['IPCA-15'] ?? null,
                servicos: latestMom['Serviços'] ?? null,
                alimentacao: latestMom['Alimentação no domicílio'] ?? null,
                ex3: latestMom['Ex3'] ?? null,
                administrados: latestMom['Administrados'] ?? null,
            };
        case 'PIM':
            return {
                mom: latestMom['1 Indústria geral'] ?? null,
                yoy: latestYoy['1 Indústria geral'] ?? null,
                extrativas: latestMom['2 Indústrias extrativas'] ?? null,
                transformacao: latestMom['3 Indústrias de transformação'] ?? null,
            };
        case 'PMC':
            return {
                mom: latestMom['PMC SA'] ?? null,
                mom_ampliado: latestMom['PMCA SA'] ?? null,
                yoy: latestYoy['PMC NSA'] ?? null,
            };
        case 'PMS':
            return {
                mom: latestMom['Total'] ?? null,
                yoy: latestYoy['Total'] ?? null,
                familias: latestMom['1. Serviços prestados às famílias'] ?? null,
            };
        default:
            return {};
    }
}

/**
 * Get data and generate report for a specific indicator
 */
async function generateReportForIndicator(
    indicator: IndicatorType
): Promise<FlashReport | null> {
    // Get the right data source
    let momData: DataRow[];
    let yoyData: DataRow[];
    let link: string;
    let mainKey: string;

    switch (indicator) {
        case 'IPCA':
            momData = ipcaData.mom as DataRow[];
            yoyData = ipcaData.a12 as DataRow[];
            link = '/indicators/ipca';
            mainKey = 'IPCA';
            break;
        case 'IPCA15':
            momData = ipca15Data.mom as DataRow[];
            yoyData = ipca15Data.a12 as DataRow[];
            link = '/indicators/ipca';
            mainKey = 'IPCA-15';
            break;
        case 'PIM':
            momData = pimData.mom as DataRow[];
            yoyData = pimData.yoy as DataRow[];
            link = '/indicators/pim';
            mainKey = '1 Indústria geral';
            break;
        case 'PMC':
            momData = pmcData.mom as DataRow[];
            yoyData = pmcData.yoy as DataRow[];
            link = '/indicators/pmc';
            mainKey = 'PMC SA';
            break;
        case 'PMS':
            momData = pmsData.mom as DataRow[];
            yoyData = pmsData.yoy as DataRow[];
            link = '/indicators/pms';
            mainKey = 'Total';
            break;
        default:
            return null;
    }

    if (!momData?.length) return null;

    const latestMom = momData[momData.length - 1];
    const previousMom = momData[momData.length - 2];
    const latestYoy = yoyData?.[yoyData.length - 1] || {};
    const referenceDate = latestMom.data_date;

    // Fetch IBGE news for this indicator
    const ibgeNews = await getLatestNewsForIndicator(indicator);

    // Format PX data context for Groq
    const pxDataContext = formatDataContextForIndicator(
        indicator,
        latestMom,
        previousMom,
        latestYoy
    );

    // Generate analysis with Groq
    const { headline, analysis } = await generateGroqAnalysis(
        indicator,
        pxDataContext,
        ibgeNews,
        referenceDate,
        latestMom,
        previousMom,
        latestYoy
    );

    // Extract metrics
    const metrics = extractMetrics(indicator, latestMom, latestYoy);

    // Prepare chart data (last 12 months)
    const chartData: ChartDataPoint[] = momData.slice(-12).map((row) => ({
        date: formatShortDate(row.data_date),
        value: row[mainKey] as number,
    }));

    return {
        id: `${indicator.toLowerCase()}-${referenceDate}`,
        indicator,
        reference_date: referenceDate,
        headline,
        metrics,
        analysis,
        chart_data: chartData,
        link,
        source_title: ibgeNews?.title || null,
        source_url: ibgeNews?.sourceUrl || null,
        generated_at: new Date().toISOString(),
    };
}

/**
 * Generate all flash reports with Groq fusion
 */
export async function generateAllReports(): Promise<FlashReport[]> {
    const indicators: IndicatorType[] = ['IPCA', 'PIM', 'PMC', 'PMS'];
    const reports: FlashReport[] = [];

    for (const indicator of indicators) {
        try {
            const report = await generateReportForIndicator(indicator);
            if (report) {
                reports.push(report);
            }
            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Error generating ${indicator} report:`, error);
        }
    }

    // Sort by reference date (most recent first)
    reports.sort((a, b) => b.reference_date.localeCompare(a.reference_date));

    return reports;
}

export interface FlashReportsCache {
    metadata: {
        last_updated: string;
        report_count: number;
    };
    reports: FlashReport[];
}
