import Parser from "rss-parser";

export interface IbgeNewsItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  isoDate: string;
}

// Dados de exemplo ROBUSTOS para garantir carregamento imediato
const MOCK_IPCA = { value: "0.56", period: "outubro 2025" };

const MOCK_IPCA15_SERIES = {
  latest: {
    value: 0.48,
    referencePeriod: "novembro 2025",
    releaseDate: "2025-11-23",
  },
  nextRelease: {
    expectedDate: "2025-12-23",
    referencePeriod: "dezembro 2025",
    confidence: "alta",
  },
  history: [
    { date: "2025-11-01", value: 0.48 },
    { date: "2025-10-01", value: 0.56 },
    { date: "2025-09-01", value: 0.45 },
    { date: "2025-08-01", value: 0.42 },
    { date: "2025-07-01", value: 0.39 },
    { date: "2025-06-01", value: 0.36 },
    { date: "2025-05-01", value: 0.53 },
    { date: "2025-04-01", value: 0.32 },
    { date: "2025-03-01", value: 0.31 },
    { date: "2025-02-01", value: 0.27 },
    { date: "2025-01-01", value: 0.29 },
    { date: "2024-12-01", value: 0.46 },
  ],
} as const;

const MOCK_NEWS: IbgeNewsItem[] = [
  {
    title: "PIB cresce 2,9% em 2025 impulsionado pelo agro",
    link: "https://agenciadenoticias.ibge.gov.br/mock-1",
    pubDate: "Mon, 18 Nov 2025 10:00:00 GMT",
    content:
      "O Produto Interno Bruto (PIB) brasileiro apresentou crescimento acima do esperado...",
    isoDate: "2025-11-18T10:00:00.000Z",
  },
  {
    title: "Produção Industrial avança em 10 dos 15 locais pesquisados",
    link: "https://agenciadenoticias.ibge.gov.br/mock-2",
    pubDate: "Sun, 17 Nov 2025 14:30:00 GMT",
    content:
      "A produção industrial nacional mostrou recuperação consistente no último trimestre...",
    isoDate: "2025-11-17T14:30:00.000Z",
  },
  {
    title: "Vendas no varejo superam expectativas em outubro",
    link: "https://agenciadenoticias.ibge.gov.br/mock-3",
    pubDate: "Sat, 16 Nov 2025 09:15:00 GMT",
    content:
      "O comércio varejista registrou alta de 1,2% na comparação com o mês anterior...",
    isoDate: "2025-11-16T09:15:00.000Z",
  },
  {
    title: "Taxa de desocupação cai para 7,6% no trimestre",
    link: "https://agenciadenoticias.ibge.gov.br/mock-4",
    pubDate: "Fri, 15 Nov 2025 11:00:00 GMT",
    content:
      "A taxa de desemprego no Brasil atingiu o menor patamar desde 2015...",
    isoDate: "2025-11-15T11:00:00.000Z",
  },
];

export async function getLatestIPCA() {
  // Retornando MOCK imediatamente para destravar o site
  return MOCK_IPCA;

  /* Lógica original comentada para debug
  try {
    const response = await fetch(...)
    ...
  } catch {
    return MOCK_IPCA;
  }
  */
}

export async function getIbgeNews(limit: number = 5): Promise<IbgeNewsItem[]> {
  // Retornando MOCK imediatamente para destravar o site
  return MOCK_NEWS;

  /* Lógica original comentada para debug
  const parser = new Parser();
  const url = "..."
  try {
     ...
  } catch {
    return MOCK_NEWS;
  }
  */
}

export type Ipca15HistoryPoint = {
  date: string;
  value: number;
};

export type Ipca15Series = {
  latest: {
    value: number;
    referencePeriod: string;
    releaseDate: string;
  };
  nextRelease: {
    expectedDate: string;
    referencePeriod: string;
    confidence: "baixa" | "média" | "alta";
  };
  history: Ipca15HistoryPoint[];
};

export async function getIpca15Series(): Promise<Ipca15Series> {
  // Por enquanto usamos um mock robusto; depois podemos trocar para backend/APIs.
  return {
    ...MOCK_IPCA15_SERIES,
    history: [...MOCK_IPCA15_SERIES.history],
  };
}

