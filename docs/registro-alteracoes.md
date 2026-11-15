# Registro de alterações

## Versão 1.0.1

Correções de cinco cenários após a primeira gravação: filtros de data recuperáveis, edição natural de quantidade no produto e sacola, feedback com unidades efetivamente adicionadas, preço administrativo em formato brasileiro e foco/rolagem da edição móvel. Foram adicionados quatro testes unitários e seis execuções E2E de regressão, mantendo a suíte existente. Detalhes em correcoes-video-1.md. Sem mudanças no esquema do banco ou autenticação.

## Versão 1.0.0

A PIT I continha planejamento, backlog e evidências de organização no Jira. A implementação começou em uma pasta sem código ou histórico Git. Foram acrescentados catálogo, contas, sessões, carrinho persistente, checkout simulado, pedidos, acompanhamento e administração para as 17 histórias.

O modelo físico recebeu nove tabelas de negócio/técnicas, autenticação limitada por IP, índices e triggers para estoque/total/cancelamento. Criaram-se oito ilustrações de produtos, logo/favicon, interface responsiva, API parametrizada, validação e autorização no servidor.

Foram adicionados testes unitários, integração sobre workerd/D1 e E2E desktop/mobile, documentação pública, migrations, comandos de administração e configuração CI/CD. Os documentos originais e entregas identificadas foram separados da publicação por regras do Git.

Defeitos e ajustes encontrados durante execução estão no laudo; não se atribuem alterações a feedback humano inexistente. Os status históricos do Jira não foram reescritos nem apresentados como evidência de implementação prévia.
