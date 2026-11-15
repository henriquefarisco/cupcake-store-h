# Modelagem do banco

O modelo relaciona usuários a sessões, endereços e pedidos. Cada pedido referencia um endereço imutável capturado no checkout e contém itens com nome e preço históricos. Produtos pertencem a categorias. O histórico registra cada mudança de estado e o usuário responsável. O controle de autenticação é uma estrutura técnica separada dos dados de negócio.

As tabelas estão normalizadas quanto a identidade, catálogo, endereço e relacionamento de itens. Nome e preço são intencionalmente copiados para o item do pedido para preservar o documento histórico após edição do produto. O total materializado é mantido por trigger no mesmo lote de inserção.

Datas de negócio usam ISO 8601 em UTC, geradas pelo SQLite. Expiração técnica usa milissegundos Unix. Valores monetários são INTEGER em centavos. Aplicação converte apresentação para pt-BR e America/Sao_Paulo. Filtros de relatório representam o dia comercial em UTC-03.

O esquema físico completo está em migrations/0001_schema.sql. A segunda migration insere três categorias e oito produtos. Exclusão de produto é lógica, preservando referências e históricos. Endereços são snapshots de pedido; não existe agenda de endereços reutilizáveis. O [DER](diagramas/der.svg) e o [dicionário](dicionario-dados.md) descrevem o esquema real.
