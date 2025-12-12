# 📰 Como Gerenciar Notícias no PX Economics

## 🚀 Método Recomendado: Criar Notícias em Markdown

### Opção 1: Usar o Script Automático

```powershell
.\criar-noticia.ps1
```

O script vai perguntar:
- **Título da notícia**
- **Resumo**

E criar o arquivo automaticamente!

### Opção 2: Criar Manualmente

1. **Crie um arquivo** em `frontend/content/news/`
2. **Nomeie** como `titulo-da-noticia.md`
3. **Use esta estrutura**:

```markdown
---
title: Título da Sua Notícia
date: 2025-11-19T14:30:00.000-03:00
thumbnail: /images/uploads/placeholder.webp
description: Resumo curto que aparece no card da notícia
---

# Título da Notícia

## Introdução

Escreva aqui a introdução da sua notícia.

## Seção Principal

Conteúdo principal com:
- **Negrito**
- *Itálico*
- [Links](https://exemplo.com)

### Subseção

Mais conteúdo...

## Dados e Estatísticas

Você pode incluir tabelas:

| Indicador | Valor | Variação |
|-----------|-------|----------|
| IPCA      | 0.56% | +0.1 p.p |
| Selic     | 11.25%| +0.5 p.p |

## Conclusão

Finalize sua análise aqui.
```

## 📝 Campos do Frontmatter

- `title`: Título da notícia
- `date`: Data de publicação (formato ISO)
- `thumbnail`: Caminho da imagem de capa (relativo a `public/`)
- `description`: Resumo curto para o card

## 🖼️ Como Adicionar Imagens

1. Coloque a imagem em `frontend/public/images/uploads/`
2. No frontmatter, use: `thumbnail: /images/uploads/nome-da-imagem.jpg`

## 🎯 Dicas de Markdown

### Títulos
```markdown
# Título Nível 1
## Título Nível 2
### Título Nível 3
```

### Listas
```markdown
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2
```

### Links e Imagens
```markdown
[Texto do link](https://url.com)
![Descrição da imagem](/caminho/imagem.jpg)
```

### Citações
```markdown
> Esta é uma citação importante
```

### Código
```markdown
Inline: `código aqui`

Bloco:
```python
def exemplo():
    return "código"
```
```

## 📂 Estrutura de Arquivos

```
frontend/
├── content/
│   └── news/
│       ├── exemplo-nova-noticia.md
│       ├── minha-primeira-analise.md
│       └── nova-noticia-teste.md
└── public/
    └── images/
        └── uploads/
            └── placeholder.webp
```

## ✅ Verificar se a Notícia Apareceu

1. Salve o arquivo `.md`
2. Acesse: http://localhost:3000
3. A notícia deve aparecer nos "Destaques PX Economics"
4. Acesse: http://localhost:3000/news para ver todas as notícias

## 🔄 Atualizar uma Notícia

1. Abra o arquivo `.md` existente
2. Edite o conteúdo
3. Salve
4. Recarregue o site (pode precisar de hard refresh: Ctrl+F5)

## 🎨 Personalizar o Visual

As notícias usam o mesmo estilo do site. Para personalizar:
- Edite `frontend/src/components/FeaturedNews.tsx`
- Edite `frontend/src/app/news/page.tsx`

## 🤔 FAQ

**Q: Por que não usar o CMS?**
A: Criar arquivos Markdown é mais rápido, confiável e dá controle total. O CMS é útil para equipes não-técnicas.

**Q: Posso usar HTML dentro do Markdown?**
A: Sim! Markdown aceita HTML:
```markdown
<div class="alerta">
  Este é um alerta especial!
</div>
```

**Q: Como apagar uma notícia?**
A: Delete o arquivo `.md` correspondente.

**Q: As notícias antigas ficam arquivadas?**
A: Todas as notícias aparecem em `/news`. Não há arquivamento automático.

## 📞 Suporte

Para dúvidas sobre Markdown:
- [Guia Markdown](https://www.markdownguide.org/basic-syntax/)
- [Cheat Sheet](https://www.markdownguide.org/cheat-sheet/)

---

**Criado para PX Economics** 🚀

