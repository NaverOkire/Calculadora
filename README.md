💻 Calculadora & Gerenciador Financeiro

Aplicação web full-stack desenvolvida com foco em evolução prática de lógica de programação, construção de sistemas completos e integração entre frontend, backend e banco de dados.

O projeto iniciou como uma calculadora simples e evoluiu para um gerenciador financeiro com autenticação de usuários, persistência de dados e gerenciamento de contas.

🚀 Funcionalidades
🔢 Calculadora
Operações básicas: +, -, ×, ÷
Suporte a parênteses e múltiplas operações
Tratamento de porcentagem (%)
Engine baseada em expressões
Histórico interativo de cálculos
Suporte ao teclado
Backspace
Melhor organização interna (dispatch central de operadores)
🧾 Bills Manager (Contas a Pagar)

Sistema completo de gerenciamento de contas integrado ao usuário:

CRUD completo:
Criar contas
Listar contas
Atualizar dados/status
Deletar contas
Associação direta com o usuário autenticado
Persistência em banco de dados (MySQL)
Validação de dados no backend
Tratamento de erros estruturado
Feedback de erro no frontend
Resumos e organização das contas
Interface dedicada no painel principal
🔐 Autenticação & Usuários
Registro de usuários
Login com autenticação via JWT
Senhas protegidas com hash (bcrypt)
Rotas protegidas com middleware
Sessão integrada com frontend
📊 Dados
Dados vinculados ao usuário autenticado
Estrutura preparada para expansão futura (analytics, relatórios, etc.)
🎨 Interface & Experiência
Tema claro/escuro com persistência
Layout responsivo
Ajuste automático de fonte
Copiar resultado com clique
Interações otimizadas para mobile
Feedback visual e animações
Melhorias no fluxo de autenticação
Interface expandida com painel de contas
🛠️ Tecnologias
Frontend
HTML5
CSS3
JavaScript
Backend
Node.js
Express
Banco de Dados
MySQL
Segurança
JWT (autenticação)
bcrypt (hash de senha)
⚙️ Arquitetura
API REST em Node.js
Separação em:
Controllers
Routes
Middleware
Banco relacional com schema definido via SQL
Frontend consumindo API via HTTP
Estrutura modular e escalável
🎯 Objetivo
Evoluir de um projeto simples para uma aplicação full-stack
Consolidar fundamentos de backend e banco de dados
Aplicar boas práticas de arquitetura
Desenvolver um sistema funcional e escalável
📌 Status

🚧 Em desenvolvimento

Próximos passos:
Melhorar validações e tratamento de erros
Implementar refresh token
Deploy da aplicação
Logs e monitoramento
Integração com IA (assistente financeiro)
📄 Licença

Este projeto está sob a licença MIT.
