v0.3.0] – Reforço de Segurança e Sessões
Segurança & Autenticação
Sessões Seguras: Migração do armazenamento de tokens (LocalStorage) para Cookies HttpOnly, protegendo a aplicação contra ataques XSS.

Proteção de API: Implementação de rateLimit para prevenir ataques de força bruta e sobrecarga do servidor.

Hardening do Servidor: Configuração rigorosa de CORS e headers de segurança. Adição de verificações críticas de variáveis de ambiente e tratamento de erros assíncronos com asyncHandler.

Backend & Banco de Dados
Refatoração de Transações: Melhoria no processamento de valores monetários e validação rigorosa de propriedade (garantindo que um usuário só acesse seus próprios dados).

Validação Estrita: Implementação de regras de entrada mais fortes (senhas complexas, formatos de data ISO e validação de parâmetros de rota).

Integridade de Dados: Atualização do schema SQL com restrições (CHECK constraints) para garantir dados financeiros consistentes.

Frontend
Remoção de Código Inseguro: Substituição do uso de eval() por um parser de expressões numéricas exclusivo, eliminando vulnerabilidades de execução de script.

Gestão de Estado: Nova lógica de inicialização de sessão (getSession) e fluxo de logout integrado ao backend.

[v0.2.0] – Integração Full Stack
Persistência de Dados
Integração MySQL: Configuração de pool de conexões e criação do schema inicial do banco de dados.

Histórico: Persistência de cálculos e histórico financeiro diretamente no banco de dados.

Autenticação
Sistema de Usuários: Criação de rotas para registro e login.

Criptografia: Implementação de hash de senhas utilizando bcrypt.

Tokens: Autenticação baseada em JWT para proteção de rotas privadas.

Funcionalidades da API
CRUD de Transações: Endpoints para criar, ler, atualizar e deletar transações financeiras, com isolamento total entre usuários.

Comunicação: Integração completa entre o Frontend (Vanilla JS) e o Backend (Node.js/Express) via requisições HTTP.
