# GitHub e Cloudflare

Repositório: https://github.com/henriquefarisco/cupcake-store-h. Worker: cupcake-store-h. D1: cupcake-store-h-db. O Account ID pode ser obtido por `npx wrangler whoami` ou no painel da conta. O ID de banco no wrangler.jsonc é um identificador público de binding, não uma credencial.

## Credenciais

O caminho preferido para CI permanente é um API token dedicado, restrito à conta de destino, com Workers Scripts Edit, D1 Edit e Account Settings Read quando necessário para consultar subdomínio. Crie-o em My Profile → API Tokens no painel Cloudflare. Não inclua permissões de outras contas ou zonas desnecessárias. Mantenha o valor fora de arquivos públicos.

Registre `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` em Settings → Secrets and variables → Actions. A CLI `gh secret set NOME` aceita o valor pela entrada padrão, sem incluí-lo na linha de comando.

O ambiente inicial dispunha de OAuth do Wrangler, não de token dedicado. Para executar a publicação com o acesso disponível, `node scripts/sync-deploy-auth.mjs` sincroniza o bearer OAuth temporário para o secret e registra sua expiração na variável `CLOUDFLARE_AUTH_EXPIRES_AT`. O script não imprime o segredo. A pipeline recusa credenciais vencidas. Isso permite validar a esteira real, mas não configura autenticação permanente: antes de um novo push/deploy, execute novamente o script no ambiente local autenticado. Não copie o refresh token para o GitHub. Para eliminar essa dependência local, forneça API token dedicado pelo ambiente e execute o mesmo script; a variável de expiração temporária será limpa.

O OAuth existente tem escopos mais amplos que o token dedicado recomendado. Não são criadas novas permissões Cloudflare por esse procedimento. Revogue o OAuth em seu perfil Cloudflare e remova/substitua o secret do GitHub se não desejar reutilizá-lo. Não publique conteúdo não confiável em main: workflows dessa branch conseguem usar secrets de produção.

## Publicar e verificar

1. Execute testes, build e verificação de privacidade.
2. Sincronize a credencial disponível antes do push: `node scripts/sync-deploy-auth.mjs`.
3. Faça commit e push para main ou acione o workflow manualmente.
4. Use `gh run list` e `gh run view ID` para acompanhar Quality, Tests, Build, Deploy e Smoke Tests.
5. O deploy aplica migrations pendentes, publica o Worker e executa smoke somente leitura.

PRs executam qualidade e testes, sem publicação. A concorrência por branch impede deploy simultâneo. O job de produção depende dos demais e usa environment production. Nenhum workflow exige serviço pago.

## Logs e recuperação

`npx wrangler tail` acompanha logs durante diagnóstico. Não registre payloads, e-mails, endereços, cookies ou senhas. Use métricas agregadas e erros sanitizados. `npx wrangler deployments list` mostra versões; `npx wrangler rollback` restaura código após selecionar a versão correta. Rollback de Worker não desfaz migrations nem pedidos.

Antes de uma migration destrutiva, exporte o D1 por `wrangler d1 export DB --remote --output caminho-local.sql` e guarde fora do Git. Prefira migrations aditivas compatíveis com versões anterior/nova. Aplique em ambiente local, teste e somente depois envie ao remoto. Não edite migration já aplicada para alterar a história do banco.

## Proteção da branch

Em GitHub Settings → Branches/Rulesets, crie regra para main, exija PR, revisão e checks Quality, Tests e Build, bloqueie force push e exclusão. Esta documentação descreve a configuração; não implica que a proteção tenha sido ativada. O administrador deve avaliar a regra antes de alterações que possam impedir manutenção.

## Fontes oficiais consultadas

- [Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Limites Workers](https://developers.cloudflare.com/workers/platform/limits/)
- [D1 batch e execução transacional](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [Wrangler Action oficial](https://github.com/cloudflare/wrangler-action)
