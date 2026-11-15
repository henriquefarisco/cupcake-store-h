# Riscos e limitações

Aplicação acadêmica e pagamentos simulados: não está preparada como operação comercial de confeitaria. Não há checkout financeiro, emissão fiscal, logística real, recuperação de senha, confirmação de e-mail ou garantias de antifraude. Use somente dados fictícios durante avaliações.

PBKDF2-SHA-256 usa 100.000 iterações e salt aleatório individual, compatível com Web Crypto do Workers. O teto do runtime limita o fator de trabalho; esse parâmetro é inferior a recomendações modernas para alguns ambientes de produção. Não se deve reduzir o fator para contornar CPU. A compatibilidade funcional e autenticação remota precisam ser verificadas após deploy; limites de CPU e tráfego do plano gratuito podem impedir aumento de carga. Não existe teste de carga ou auditoria de segurança exaustiva.

O rate limit persistido combina cadastros e logins por hash de IP. Redes compartilhadas podem atingir o limite; o controle é básico, não substitui defesa contra abuso distribuído. Sessões expiram em sete dias e são limpas em novos logins/cadastros. Não há UI de revogação de todas as sessões. Não há alteração de senha/e-mail no perfil.

O carrinho usa localStorage com preços apenas indicativos. O checkout consulta valores atuais; confirmação no servidor é a autoridade final. Uma recarga do checkout gera nova chave; antes de repetir uma compra com resultado incerto, consulte os pedidos para evitar nova submissão independente.

Listagens privadas são limitadas a 100 pedidos e 500 produtos administrativos; a vitrine possui paginação. Relatórios usam todos os registros do período consultado. Grande volume requer rever índices e paginação. Fontes tipográficas externas possuem fallback local de sistema. As ilustrações são locais.

Testes mobile são emulação Chromium de viewport/toque, não certificação em iPhone físico ou Safari. Testes de teclado e foco não representam conformidade WCAG completa. Avaliações de cinco pessoas e gravação dos vídeos permanecem exigências humanas, sem resultados fictícios.

A PIT II sugere outras linguagens de back-end. TypeScript é uma adaptação justificada à arquitetura solicitada; não há declaração de aprovação específica pelo tutor.
