# Ambiente Docker e PostgreSQL

Status: Aceito

O projeto passa a oferecer um ambiente Docker Compose com PostgreSQL como opção
ao SQLite local, mantendo o banco de dados como uma escolha de ambiente, não de
domínio. Nenhuma regra de negócio de Merchant, Status, Timeline ou Merchant
Event muda entre os bancos.

## Decisão

A aplicação Django detecta automaticamente o banco a ser usado a partir de
variáveis de ambiente:

- Se `POSTGRES_DB` estiver definida, conecta em PostgreSQL usando as variáveis
  `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` e `POSTGRES_PORT` (com
  defaults sensíveis).
- Se `POSTGRES_DB` não estiver definida, usa SQLite local (`db.sqlite3`).

O ambiente Docker Compose define duas camadas:

- **`db`**: PostgreSQL 16 Alpine com healthcheck, volume nomeado para
  persistência, e variáveis de ambiente para banco, usuário e senha.
- **`app`**: aplicação Django/DRF construída a partir do `Dockerfile`, que
  instala as dependências Python e expõe o servidor na porta 8000. O serviço
  da aplicação só inicia após o PostgreSQL estar saudável.

O `Dockerfile` usa `python:3.12-slim` como imagem base, copia as dependências
primeiro (aproveitamento de cache) e expõe a porta 8000 com o servidor de
desenvolvimento do Django escutando em todas as interfaces do container.

## Motivação

- O avaliador técnico deve conseguir rodar a API rapidamente com SQLite sem
  instalar Docker ou PostgreSQL.
- O avaliador técnico também deve ter uma forma reproduzível de testar a
  aplicação com PostgreSQL via Docker.
- O projeto não deve depender de comportamento específico do SQLite; a
  verificação com PostgreSQL valida a portabilidade do schema e das queries.
- O ambiente containerizado é um diferencial de maturidade operacional no
  contexto do desafio técnico.

## Consequências

- SQLite permanece como o banco padrão para desenvolvimento e avaliação rápida.
- PostgreSQL via Docker é uma opção documentada, não um substituto obrigatório.
- Migrations continuam sendo a fonte de verdade do schema para ambos os bancos.
- O driver `psycopg[binary]` foi adicionado às dependências do projeto.
- O README documenta os dois caminhos com comandos verificáveis.
- Nenhum modelo, serializador, view, serviço ou endpoint de Merchant foi
  alterado — a mudança é exclusivamente de infraestrutura e configuração.
- A suíte de testes existente (27 testes) continua passando em ambos os
  ambientes.

## Alternativa rejeitada

Foi considerada a opção de usar SQLite também no Docker, mas isso foi rejeitado
porque o objetivo do ambiente containerizado é justamente demonstrar
portabilidade entre bancos. Também foi cogitado o uso de `docker-entrypoint.sh`
para rodar migrations automaticamente na subida, mas optou-se por manter as
migrations como um comando explícito do avaliador, alinhado à transparência do
processo.
