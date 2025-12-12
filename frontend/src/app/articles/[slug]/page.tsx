export default function ArticlePage({ params }: { params: { slug: string } }) {
  // Dados de exemplo para os artigos (simulando um banco de dados)
  const articles: { [key: string]: { title: string; content: string[] } } = {
    'primeiro-artigo': {
      title: 'Análise da Política Monetária Recente',
      content: [
        'A recente decisão do Comitê de Política Monetária (COPOM) de manter a taxa de juros básica (Selic) em patamares elevados gerou um intenso debate entre economistas e agentes de mercado. Esta análise visa dissecar os fundamentos macroeconômicos que pautaram tal decisão, utilizando um modelo de Vetores Autorregressivos (VAR) para avaliar os impactos potenciais sobre a inflação, o crescimento do PIB e o câmbio no horizonte de 6 a 18 meses.',
        'O modelo VAR estimado considera as seguintes variáveis endógenas: IPCA, PIB trimestral, taxa de câmbio (R$/US$) e a própria taxa Selic. Os dados, dessazonalizados, abrangem o período de 2010 a 2023. As funções de impulso-resposta indicam que um choque contracionista na política monetária, como o observado, tende a reduzir a inflação de forma estatisticamente significante após três trimestres, ao custo de uma desaceleração, também significante, da atividade econômica.',
        'Conclui-se que a decisão do Banco Central reflete uma postura de aversão ao risco inflacionário, priorizando a ancoragem das expectativas em detrimento de um estímulo econômico de curto prazo. As projeções do modelo sugerem que a convergência da inflação para a meta ocorrerá, mas o ritmo da recuperação econômica dependerá de fatores exógenos, como o cenário fiscal e a conjuntura internacional.'
      ]
    },
    'segundo-artigo': {
      title: 'O Futuro das Energias Renováveis no Brasil',
      content: [
        'Parágrafo 1 do segundo artigo...',
        'Parágrafo 2 do segundo artigo...'
      ]
    },
    'terceiro-artigo': {
      title: 'Impacto da Tecnologia na Produtividade Nacional',
      content: [
        'Parágrafo 1 do terceiro artigo...',
        'Parágrafo 2 do terceiro artigo...'
      ]
    },
    'quarto-artigo': {
      title: 'Infraestrutura e logística: o efeito das concessões',
      content: [
        'Parágrafo 1 do quarto artigo...',
        'Parágrafo 2 do quarto artigo...'
      ]
    }
  };

  const article = articles[params.slug];

  if (!article) {
    return <div>Artigo não encontrado.</div>;
  }

  return (
    <article className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <div className="prose lg:prose-xl max-w-none">
        {article.content.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
