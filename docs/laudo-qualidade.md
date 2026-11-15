# Laudo técnico de qualidade

## Complemento da versão 1.0.1

Os cinco casos B01–B05 reproduzidos após a primeira versão foram corrigidos: preço com vírgula, recuperação/validação dos filtros de data, edição de quantidade sem zero imposto, feedback da quantidade adicionada e foco/rolagem na edição móvel. A rodada local final aprovou 15 unitários, 40 verificações de integração e 14 E2E. Evidências e limites do reteste constam em [correcoes-video-1.md](correcoes-video-1.md). As confirmações humanas continuam separadas e pendentes. O texto a seguir preserva a avaliação inicial da versão 1.0.0.

Cupcake Store H, versão 1.0.0. Avaliação em 15 de novembro de 2026, ambiente Windows/Node 24, Chromium, workerd e D1 local; smoke em Cloudflare Workers/D1 remoto. A referência verificável de código é o commit da execução publicada no GitHub Actions, complementada pelo registro local de entrega. Este documento inicial acompanha a implementação e não inventa hash anterior à criação do commit.

## Objetivo e método

Verificar os fluxos H01–H17, consistência de dados, autorização, usabilidade básica e publicação. Foram executados testes unitários, integração HTTP no runtime Worker, E2E desktop/mobile, inspeção do contrato e esquema SQL, lint, tipos, auditoria de dependências, build e smoke remoto. As cinco avaliações de usuários reais são uma etapa separada, pendente.

## Resultados

11 testes unitários, 40 verificações de integração e oito E2E aprovados na rodada local final, sem reprovações remanescentes nessa rodada. O catálogo consulta D1; cadastro e sessões são reais; checkout grava pedido e endereço atomicamente; estoque e preços são controlados no servidor. Administração é protegida por papel, e consultas de pedidos exigem titularidade ou administrador. Concorrência, duplicação de pedido, sessão expirada e CSRF externo foram verificados.

Build, ESLint e TypeScript passaram. Auditoria npm resultou em zero vulnerabilidades conhecidas após correção transitiva. O deploy inicial foi confirmado e o smoke remoto passou para página inicial, rotas SPA, health/banco, catálogo e assets. Resultados posteriores de Actions devem ser associados ao SHA da execução correspondente.

## Defeitos e correções

| ID  | Reprodução e causa                                                                                                   | Severidade                     | Correção e reteste                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| D01 | Confirmar pedido válido retornava 409; INSERT do endereço tinha dez placeholders para nove campos                    | Alta funcional                 | Corrigida aridade; integração completa aprovada                                    |
| D02 | Teste de filtro não encontrava rótulo exato porque o texto das opções integrava a associação implícita               | Baixa/usabilidade e teste      | aria-label explícito em categoria/preço; E2E desktop/mobile aprovado               |
| D03 | Teste de produto reutilizava nome e podia selecionar registro de execução anterior; comparação BRL sensível a espaço | Falha de teste                 | Nome único por execução e assert no registro apropriado; oito E2E aprovados        |
| D04 | Auditoria encontrou sete alertas moderados transitivos via minimatch em typescript-eslint                            | Dependência de desenvolvimento | Override para minimatch 11 corrigido; npm audit sem alertas e lint/tipos aprovados |
| D05 | Porta 8787 já era usada por outro projeto e devolvia API diferente                                                   | Ambiente                       | Porta dedicada 8793; outro serviço preservado; health e integração corretos        |

Evidências: plano-testes.md, evidencias/integracao.json, screenshots desktop/mobile e artefatos JUnit/HTML da pipeline. Nenhum defeito foi atribuído a um avaliador humano inexistente.

## Parecer

A aplicação atende os fluxos funcionais implementados e testados para uma demonstração acadêmica, com persistência e controles proporcionais. Recomenda-se uso com dados fictícios, observando os limites de Workers Free. Não se recomenda operação comercial sem revisão adicional de segurança, privacidade, recuperação de acesso, faturamento e logística. Não houve auditoria de carga, certificação WCAG ou validação em todos os navegadores.

Permanecem avaliações de cinco pessoas, os dois vídeos e a decisão acadêmica sobre a adaptação de linguagem. A autenticação de CI inicial é temporária e deve ser renovada localmente ou substituída por token dedicado para deploys futuros. Ver riscos-limitacoes.md e configuracao-github-cloudflare.md.
