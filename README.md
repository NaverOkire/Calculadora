Entendido. Removi as referências ao Modo Financeiro (Amortização, Price, SAC) e foquei na nova estrutura que prioriza o Gerenciador de Contas (Bills To-Do) junto à Calculadora.

Aqui está o README atualizado:

💻 Calculadora & Gerenciador Financeiro
Aplicação web full-stack desenvolvida com foco em evolução prática de lógica de programação, construção de sistemas completos e integração entre frontend, backend e banco de dados.

O projeto iniciou como uma calculadora simples e evoluiu para uma ferramenta de gestão pessoal, unindo cálculos rápidos e controle de obrigações financeiras.

🚀 Funcionalidades
🔢 Calculadora Inteligente
Operações Avançadas: Suporte a expressões complexas, uso de parênteses e tratamento de porcentagem.

Histórico Interativo: Visualização de cálculos anteriores para conferência rápida.

UX Otimizada: Suporte total a teclado físico, função backspace e cópia de resultados com um clique.

Interface Adaptável: Ajuste automático de fontes para manter a legibilidade em qualquer dispositivo.

📝 Gestão de Contas (Bills To-Do) — Novo!
Controle de Pendências: Painel completo para gerenciamento de contas a pagar e receber.

Fluxo CRUD: Interface integrada para criar, listar, editar e excluir obrigações financeiras.

Organização de Dados: Persistência no banco de dados com vínculos diretos ao perfil do usuário autenticado.

Feedback em Tempo Real: Validação de formulários e notificações de erro/sucesso para ações do usuário.

🔐 Autenticação & Segurança
Sistema de Login: Registro e acesso seguro via JWT (JSON Web Token).

Proteção de Dados: Senhas criptografadas com bcrypt e sessões protegidas por HttpOnly cookies.

Segurança de Servidor: Implementação de Rate Limiting para prevenção de ataques e proteção contra acessos indevidos às rotas.

🎨 Interface & Experiência (UI/UX)
Design Moderno: Layout responsivo com paleta de cores otimizada e botões com gradientes.

Temas: Suporte a modo claro e escuro com persistência de preferência.

Navegação Fluida: Transições suaves entre o painel de cálculos e a gestão de contas.

🛠️ Tecnologias
Frontend: HTML5, CSS3, JavaScript (ES6+ com módulos dedicados).

Backend: Node.js, Express.

Banco de Dados: MySQL (Schema relacional com constraints e índices).

Segurança: JWT, bcrypt, Rate Limiters, Validação de inputs.

⚙️ Arquitetura
O sistema utiliza uma arquitetura API REST organizada para escalabilidade:

Backend: Divisão clara entre controllers (lógica), routes (endpoints) e middlewares (segurança).

Frontend: Estrutura modular (ex: BillsApp) para manipulação de DOM e requisições assíncronas de forma limpa.

📌 Status
🚧 Em desenvolvimento

Próximos passos:

Implementação de Refresh Tokens.

Categorização de contas por ícones ou cores.

Sistema de notificações/avisos para contas próximas do vencimento.

Deploy da aplicação.

📄 Licença
Este projeto está sob a licença MIT.
