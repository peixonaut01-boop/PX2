import { NextRequest, NextResponse } from 'next/server';

// Importar dados diretamente
import ipcaData from '../../../../public/data/ipca.json';
import ipca15Data from '../../../../public/data/ipca15.json';
import pmcData from '../../../../public/data/pmc.json';
import pmsData from '../../../../public/data/pms.json';
import pimData from '../../../../public/data/pim.json';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ============================================================================
// CONTEXTO DO SITE (SKELETON)
// ============================================================================
const WEBSITE_CONTEXT = `
ESTRUTURA DO SITE (PX Economics):
1. **Home (/)**: Visão geral, últimos destaques.
2. **Indicadores Brasil**:
   - /indicators/ipca: Inflação (IPCA, IPCA-15, Núcleos, Difusão).
   - /indicators/pms: Serviços (Volume de Serviços).
   - /indicators/pmc: Varejo (Vendas no comércio).
   - /indicators/pim: Indústria (Produção Industrial).
3. **Notícias (/news)**: Artigos e análises.
4. **Área do Cliente (/cliente)**:
   - Dashboard: Download de planilhas Excel (IPCA, PIB, PIM, PMC, PMS, etc.).
   - Chatbot: Assistente de análise de dados (VOCÊ).

CAPACIDADES:
- O usuário pode baixar dados históricos completos em Excel na área do cliente.
- O site atualiza dados automaticamente minutos após a divulgação oficial do IBGE.
`;

// ============================================================================
// HELPERS DE DADOS
// ============================================================================

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function getIPCAContext() {
  const result: string[] = [];

  if (ipcaData?.mom?.length) {
    const fresh = (ipcaData.mom as any[]).slice(-6);
    result.push('\n## IPCA (Inflação) - MoM (%):');
    fresh.forEach((item: any) => {
      result.push(`${formatDate(item.data_date)}: Geral=${item.IPCA?.toFixed(2)}%, Serv=${item.Serviços?.toFixed(2)}%, Alim=${item['Alimentação no domicílio']?.toFixed(2)}%`);
    });
  }

  if (ipca15Data?.mom?.length) {
    const fresh15 = (ipca15Data.mom as any[]).slice(-3);
    result.push('\n## IPCA-15 (Prévia) - MoM (%):');
    fresh15.forEach((item: any) => {
      const val = item['IPCA-15'] || item.IPCA15;
      result.push(`${formatDate(item.data_date)}: Geral=${val?.toFixed(2)}%`);
    });
  }
  return result.join('\n');
}

function getPMCContext() {
  const result: string[] = [];
  if (pmcData?.mom?.length) {
    const fresh = (pmcData.mom as any[]).slice(-6);
    result.push('\n## PMC (Varejo) - Variação Mensal (MoM %):');
    fresh.forEach((item: any) => {
      result.push(`${formatDate(item.data_date)}: Restrito=${item['PMC SA']?.toFixed(2)}%, Ampliado=${item['PMCA SA']?.toFixed(2)}%`);
    });
  }
  if (pmcData?.yoy?.length) {
    const fresh = (pmcData.yoy as any[]).slice(-3);
    result.push('\n## PMC (Varejo) - Anual (YoY %):');
    fresh.forEach((item: any) => {
      result.push(`${formatDate(item.data_date)}: Restrito=${item['PMC NSA']?.toFixed(2)}%, Ampliado=${item['PMCA NSA']?.toFixed(2)}%`);
    });
  }
  return result.join('\n');
}

function getPMSContext() {
  const result: string[] = [];
  if (pmsData?.mom?.length) {
    const fresh = (pmsData.mom as any[]).slice(-6);
    result.push('\n## PMS (Serviços) - Variação Mensal (MoM %):');
    fresh.forEach((item: any) => {
      // PMS MoM geralmente é tratado (SA)
      result.push(`${formatDate(item.data_date)}: Total=${item['Total']?.toFixed(2)}%, Famílias=${item['1. Serviços prestados às famílias']?.toFixed(2)}%`);
    });
  }
  return result.join('\n');
}

function getPIMContext() {
  const result: string[] = [];
  if (pimData?.mom?.length) {
    const fresh = (pimData.mom as any[]).slice(-6);
    result.push('\n## PIM (Indústria) - Variação Mensal (MoM %):');
    fresh.forEach((item: any) => {
      result.push(`${formatDate(item.data_date)}: Geral=${item['1 Indústria geral']?.toFixed(2)}%, Transformação=${item['3 Indústrias de transformação']?.toFixed(2)}%`);
    });
  }
  return result.join('\n');
}

// Junta tudo
const FULL_DATA_CONTEXT = `
${getIPCAContext()}
${getPMCContext()}
${getPMSContext()}
${getPIMContext()}
`;

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `
Você é o Assistente Pessoal da PX Economics.
Sua função é fornecer análises rápidas e precisas sobre os dados econômicos do Brasil contidos na sua base.

=== ESTRUTURA DO SITE ===
${WEBSITE_CONTEXT}

=== DADOS MAIS RECENTES (FONTE OFICIAL IBGE) ===
${FULL_DATA_CONTEXT}
================================================

REGRAS DE OURO (STRICT CONTEXT):
1. **Contexto Limitado**: Responda APENAS perguntas sobre economia, dados do site, funcionamento da plataforma ou os indicadores acima. Se o usuário perguntar sobre "receita de bolo", "futebol" ou "programação", recuse educadamente dizendo que só fala sobre economia e o site PX.
2. **Baseado em Dados**: Ao citar números, use EXATAMENTE os valores listados acima. Não alucine. Se não tiver o dado do mês solicitado, diga que a base termina em [último mês disponível].
3. **Guia do Site**: Se o usuário perguntar "onde baixo dados?" ou "tem dados de indústria?", guie-o para a página correta (/indicators/pim ou Área do Cliente).
4. **Tom**: Profissional, direto e objetivo. Financial Analyst style.

EXEMPLOS:
User: "Quanto foi o IPCA de outubro?"
Assistant: "O IPCA de outubro/202x foi X.XX%. O grupo de Serviços variou Y.YY%."

User: "Como faço um bolo?"
Assistant: "Desculpe, meu foco é análise de dados econômicos e suporte à plataforma PX Economics."
`;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 });

    if (GROQ_API_KEY) {
      const response = await callGroq(message);
      if (response) return NextResponse.json({ response });
    }

    return NextResponse.json({
      response: 'Modo offline (sem chave API). Dados carregados no sistema.'
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ response: 'Erro ao processar mensagem.' }, { status: 500 });
  }
}

async function callGroq(message: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

