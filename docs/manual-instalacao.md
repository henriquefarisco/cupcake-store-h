# Instalação e execução

Requisitos: Node.js 24 LTS, npm, Git e conta gratuita Cloudflare somente para publicação. Use as versões do lockfile.

```sh
npm ci
npm run build
npm run db:local
npx wrangler dev --ip 127.0.0.1 --port 8793
```

Abra http://127.0.0.1:8793. Este servidor usa workerd e D1 locais; não grava no banco de produção. Para edição com atualização rápida do React, mantenha Wrangler na porta 8793 e execute `npm run dev` em outro terminal; o Vite encaminha `/api` para o Worker.

```sh
npm run typecheck
npm run lint
npm run format:check
npm audit --audit-level=moderate
npm test
npm run test:integration
npx playwright install chromium
npm run test:e2e
```

Testes de integração e E2E alteram somente o banco local. Executam cadastro, pedidos e administração com dados fictícios. Use diretório `.wrangler` novo quando desejar um banco local inteiramente novo; não apague dados de produção. O script de integração rejeita BASE_URL externa. O smoke é separado e somente leitura.

## Primeiro administrador

Cadastre uma conta de teste pela aplicação. Em terminal autorizado, defina `ADMIN_EMAIL` para o e-mail já cadastrado e execute `node scripts/provision-admin.mjs --local` ou `--remote` para produção. O comando altera somente a função dessa conta. Não existe senha administrativa padrão, segredo no bundle ou endpoint público de bootstrap. Utilize e-mail real do responsável apenas quando necessário e mantenha a senha fora do repositório.

Se as portas estiverem ocupadas, escolha outra e ajuste proxy/BASE_URL/testes. Na execução inicial havia outro projeto usando 8787, por isso foi adotada 8793 sem interromper o outro serviço.
