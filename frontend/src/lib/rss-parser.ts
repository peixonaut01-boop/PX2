/**
 * Enhanced RSS/API Parser for IBGE Economic Indicators
 * Fetches full news text from official sources for AI fusion
 */

// Types
export interface IndicatorNews {
    id: string;
    indicator: 'IPCA' | 'IPCA15' | 'PIM' | 'PMC' | 'PMS' | null;
    title: string;
    summary: string;
    fullText: string | null;
    sourceUrl: string;
    publishedAt: string;
    referenceDate: string | null; // e.g., "2025-11-01" for November 2025 data
}

// IBGE API response types
interface IBGENewsItem {
    id: number;
    titulo: string;
    introducao: string;
    data_publicacao: string;
    link: string;
    destaque?: boolean;
    tipo?: string;
    editorias?: string;
}

/**
 * Identify indicator type from title/text
 */
function identifyIndicator(title: string, text: string): 'IPCA' | 'IPCA15' | 'PIM' | 'PMC' | 'PMS' | null {
    const combined = (title + ' ' + text).toLowerCase();

    // IPCA-15 (check first as it's more specific)
    if (combined.includes('ipca-15') || combined.includes('ipca15') || combined.includes('prévia')) {
        return 'IPCA15';
    }

    // IPCA
    if (combined.includes('ipca') || combined.includes('inflação') && combined.includes('consumidor')) {
        return 'IPCA';
    }

    // PIM
    if (combined.includes('produção industrial') || combined.includes('indústria geral') ||
        (combined.includes('pim') && combined.includes('indústria'))) {
        return 'PIM';
    }

    // PMC
    if (combined.includes('varejo') || combined.includes('comércio varejista') ||
        combined.includes('vendas no comércio') || combined.includes('pmc')) {
        return 'PMC';
    }

    // PMS
    if (combined.includes('volume de serviços') || combined.includes('setor de serviços') ||
        combined.includes('pms') || (combined.includes('serviços') && !combined.includes('inflação'))) {
        return 'PMS';
    }

    return null;
}

/**
 * Extract reference month/year from title or text
 * e.g., "IPCA de novembro" → "2025-11-01"
 */
function extractReferenceDate(title: string, text: string, pubDate: string): string | null {
    const combined = (title + ' ' + text).toLowerCase();

    const months: Record<string, string> = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
        'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
        'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };

    // Try to find month name
    for (const [name, num] of Object.entries(months)) {
        if (combined.includes(name)) {
            // Assume current or previous year based on publication date
            const pubYear = new Date(pubDate).getFullYear();
            const pubMonth = new Date(pubDate).getMonth() + 1;
            const refMonth = parseInt(num);

            // If reference month is greater than pub month, it's probably last year
            const year = refMonth > pubMonth ? pubYear - 1 : pubYear;

            return `${year}-${num}-01`;
        }
    }

    return null;
}

/**
 * Fetch news from IBGE filtered to economic indicators only
 */
export async function fetchIBGEIndicatorNews(): Promise<IndicatorNews[]> {
    try {
        // Fetch more items to filter for indicators
        const response = await fetch(
            'https://servicodados.ibge.gov.br/api/v3/noticias/?qtd=30',
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (!response.ok) {
            throw new Error(`IBGE API error: ${response.status}`);
        }

        const data = await response.json();
        const items: IBGENewsItem[] = data.items || [];

        const indicatorNews: IndicatorNews[] = [];

        for (const item of items) {
            const indicator = identifyIndicator(item.titulo, item.introducao);

            // Only include if it's one of our tracked indicators
            if (indicator) {
                indicatorNews.push({
                    id: `ibge-${item.id}`,
                    indicator,
                    title: item.titulo,
                    summary: item.introducao,
                    fullText: item.introducao, // For now, use introduction as full text
                    sourceUrl: `http://agenciadenoticias.ibge.gov.br${item.link}`,
                    publishedAt: item.data_publicacao,
                    referenceDate: extractReferenceDate(item.titulo, item.introducao, item.data_publicacao),
                });
            }
        }

        return indicatorNews;
    } catch (error) {
        console.error('Error fetching IBGE news:', error);
        return [];
    }
}

/**
 * Get the latest news for a specific indicator
 */
export async function getLatestNewsForIndicator(
    indicator: 'IPCA' | 'IPCA15' | 'PIM' | 'PMC' | 'PMS'
): Promise<IndicatorNews | null> {
    const allNews = await fetchIBGEIndicatorNews();

    // Find the most recent news for this indicator
    const filtered = allNews.filter(n => n.indicator === indicator);

    if (filtered.length === 0) return null;

    // Sort by publication date (most recent first)
    filtered.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return filtered[0];
}

/**
 * Get all indicator news organized by indicator
 */
export async function getAllIndicatorNews(): Promise<Record<string, IndicatorNews | null>> {
    const allNews = await fetchIBGEIndicatorNews();

    const result: Record<string, IndicatorNews | null> = {
        IPCA: null,
        IPCA15: null,
        PIM: null,
        PMC: null,
        PMS: null,
    };

    for (const news of allNews) {
        if (news.indicator && !result[news.indicator]) {
            result[news.indicator] = news;
        }
    }

    return result;
}
