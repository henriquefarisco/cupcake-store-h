# Implantação

Aplicação publicada em https://cupcake-store-h.contato-schwarz.workers.dev. Worker: cupcake-store-h. Banco: cupcake-store-h-db, binding DB, migrations 0001 e 0002. O primeiro deploy foi confirmado pelo Wrangler e smoke HTTP somente leitura, incluindo SPA, API e assets.

O Worker serve somente o conteúdo de dist como static assets; os documentos acadêmicos, arquivos locais de acesso e entrega não entram na pasta publicada. `/api/*` executa primeiro no Worker e devolve erros JSON; outras rotas usam fallback SPA. O servidor é compilado pelo Wrangler a partir de src/server/index.ts.

Foram usados os recursos Workers e D1 existentes na conta, sem contratação, cartão ou ativação de plano pago. Os limites do plano gratuito devem ser observados. O endpoint de consulta de assinaturas recusou o OAuth disponível e o painel web exigiu login; portanto não se afirma auditoria independente de faturamento da conta inteira. Nenhuma operação de compra ou alteração de assinatura foi executada.

## Esteira

Quality verifica formatação, ESLint, tipos, auditoria npm e arquivos privados. Tests executa domínio/criptografia, integração em workerd com D1 e Playwright desktop/mobile; relatórios são anexados à execução. Build compila e verifica assets. Deploy depende dos três jobs e só publica main em push/manual. Smoke confirma site, rotas SPA, health, catálogo e arquivos JS/CSS, sem criar clientes/pedidos em produção.

O acesso inicial foi OAuth local do Wrangler, sincronizado para secrets com expiração explícita. A execução pode ser acompanhada em https://github.com/henriquefarisco/cupcake-store-h/actions. Após expiração, sincronize novamente pelo ambiente local ou configure token dedicado; veja configuracao-github-cloudflare.md. Não confunda deploy manual confirmado com aprovação da pipeline de um commit específico.

## Recuperação

Revise `wrangler deployments list` e selecione uma versão antes de `wrangler rollback`. Mantenha compatibilidade de migrations entre versões. Não remova tabelas ou banco como método de correção. Exporte dados antes de alterações destrutivas; backups devem ser locais/privados e não entram no repositório.
