# Sistema Operacional Pessoal (POS)

Painel de produtividade pessoal desenvolvido para a disciplina **Produtividade e
Gestão do Tempo**. É uma aplicação real e funcional (não um mockup): os dados são
persistidos no Airtable e as sugestões de IA são geradas de verdade pela API do
Google Gemini.

## Stack e ferramentas

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **Airtable REST API** — camada de dados, via `fetch` nativo (sem SDK)
- **Google Gemini API** — camada de IA, via `fetch` nativo (sem SDK)
- **Vercel** — deploy
- **Claude Code** — usado para construir o projeto a partir de um plano de
  execução em fases, com autonomia assistida

## Métodos de produtividade aplicados

- **GTD (Getting Things Done)** — captura de tarefas no Kanban, organizadas por
  status (A Fazer / Em Andamento / Concluído)
- **Matriz de Eisenhower** — priorização em 4 quadrantes (urgente/importante),
  com sugestão automática via IA
- **Princípio de Pareto** — o quadrante Q1 evidencia os poucos itens de maior
  impacto que merecem atenção imediata
- **Técnica Pomodoro** — ciclos de 25 min de foco / 5 min de pausa com timer
  visual

## Como a IA é usada

Três funcionalidades reais, integradas ao Google Gemini (`gemini-3.6-flash`),
sempre chamadas do servidor (a chave nunca é exposta ao client):

1. **Sugerir prioridade** (`/api/ai/suggest-quadrant`) — no formulário de nova
   tarefa do Kanban, o botão "IA: sugerir prioridade" envia título e notas para
   o Gemini, que classifica a tarefa em Q1–Q4 da Matriz de Eisenhower com uma
   justificativa curta.
   _Exemplo: "Entregar relatório final amanhã de manhã" → **Q1**, "urgente
   devido ao prazo e importante por ser uma entrega acadêmica final."_

2. **Desdobrar tarefa** (`/api/ai/breakdown-task`) — em cada card do Kanban, o
   botão "IA: desdobrar tarefa" aplica o método EDA (Esclarecer → Desdobrar →
   Agir) e retorna de 4 a 6 subtarefas executáveis, com opção de criá-las como
   novas tarefas.

3. **Resumo semanal** (`/api/ai/weekly-summary`) — no Dashboard, o botão
   "Gerar resumo da semana" agrega os dados de Tasks, Habits e Metrics dos
   últimos 7 dias e pede ao Gemini um resumo do desempenho com sugestões de
   prioridades para a semana seguinte.

Todo resultado gerado é salvo na tabela `AIInsights` do Airtable e pode ser
consultado no card **Histórico de IA**, na parte inferior do painel — a prova
visual de que a IA está sendo usada de verdade, e não apenas simulada.

## Fluxo de organização

```
Captura (Kanban)
   → Priorização com IA (Eisenhower)
      → Planejamento semanal (grade de 7 dias)
         → Gestão de compromissos (agenda cronológica)
            → Execução com Pomodoro
               → Revisão de hábitos e métricas
                  → Resumo semanal com IA
```

## Como rodar localmente

1. Copie `.env.example` para `.env.local` e preencha as três chaves:
   ```
   AIRTABLE_TOKEN=
   AIRTABLE_BASE_ID=
   GEMINI_API_KEY=
   ```
2. Instale as dependências:
   ```
   npm install
   ```
3. Rode o servidor de desenvolvimento:
   ```
   npm run dev
   ```
4. Acesse `http://localhost:3000`.

## Como usar a solução

- **Kanban**: crie tarefas com título e notas; use "IA: sugerir prioridade"
  antes de salvar para já classificá-las na Matriz de Eisenhower; arraste os
  cards entre colunas para mudar o status; use "IA: desdobrar tarefa" para
  quebrar uma tarefa grande em passos executáveis.
- **Planejamento Semanal**: visualize blocos de Foco, Reunião, Admin e
  Descanso distribuídos nos 7 dias da semana.
- **Compromissos**: acompanhe a agenda cronológica de reuniões, entregas e
  compromissos pessoais.
- **Matriz de Eisenhower**: veja as tarefas já classificadas agrupadas pelos 4
  quadrantes.
- **Pomodoro**: use o timer para ciclos de foco e pausa.
- **Hábitos**: marque diariamente os hábitos cumpridos e acompanhe o streak.
- **Protocolo de Comunicação**: consulte as regras adotadas para e-mail, chat,
  reuniões e foco profundo.
- **Dashboard**: acompanhe as métricas da semana e gere o resumo semanal com
  IA.
- **Histórico de IA**: revise as últimas sugestões, desdobramentos e resumos
  gerados pelo Gemini.
- Alterne entre tema claro e escuro pelo botão no cabeçalho.

## Prints

<!-- Insira aqui screenshots do site publicado na Vercel. -->
