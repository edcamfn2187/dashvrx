# Vicarius vRx Executive Dashboard

Este é um dashboard executivo projetado para visualizar dados de segurança da plataforma Vicarius vRx. Ele fornece uma interface clara e interativa para monitorar métricas de segurança, vulnerabilidades e compliance em tempo real.

## Funcionalidades

- **Dashboard Dinâmico**: Visualize métricas de segurança, como total de ativos, vulnerabilidades, score de risco e compliance.
- **Gráficos Interativos**: Gráficos de pizza e de barras para detalhar a distribuição de sistemas operacionais e a severidade de vulnerabilidades por ativo.
- **Páginas Customizáveis**: Crie e gerencie múltiplas páginas de dashboard, cada uma com seu próprio conjunto de gadgets.
- **Exportação para PDF**: Exporte o relatório completo, incluindo todas as páginas do dashboard, para um arquivo PDF com um único clique.
- **Layout Responsivo**: A interface se adapta a diferentes tamanhos de tela, garantindo uma boa experiência em desktops e tablets.

## Tecnologias Utilizadas

- **React**: Biblioteca para construção de interfaces de usuário.
- **TypeScript**: Superset de JavaScript que adiciona tipagem estática.
- **Vite**: Ferramenta de build para desenvolvimento frontend.
- **Tailwind CSS**: Framework de CSS utility-first para estilização.
- **Recharts**: Biblioteca de gráficos para React.
- **Lucide React**: Biblioteca de ícones SVG.
- **jsPDF & html2canvas**: Para a funcionalidade de exportação para PDF.

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm (geralmente instalado com o Node.js)
- SQL Server

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd <diretorio-do-projeto>
   ```

2. Instale as dependências do projeto:
   ```bash
   npm install
   ```

## Configuração

1. **Variáveis de Ambiente**: Este projeto não requer variáveis de ambiente para a sua execução básica. A conexão com o banco de dados é gerenciada por um serviço externo.

2. **Configuração do Banco de Dados**

   Execute os seguintes scripts SQL no seu ambiente SQL Server para criar o banco de dados `GUIDONI` e as tabelas necessárias.

   **a. Estrutura de Tabelas**

   ```sql
   CREATE DATABASE GUIDONI;
   GO
   USE GUIDONI;
   GO

   CREATE TABLE DashboardConfigs (
       config_key NVARCHAR(100) PRIMARY KEY,
       config_value NVARCHAR(MAX) NOT NULL,
       updated_at DATETIME DEFAULT GETDATE()
   );

   CREATE TABLE endpoint (
       id INT PRIMARY KEY IDENTITY(1,1),
       endpointname NVARCHAR(100),
       operatingsystem NVARCHAR(100),
       endpointalive BIT,
       cvecount INT,
       critical INT, high INT, medium INT, low INT,
       lastscan DATETIME DEFAULT GETDATE()
   );
   ```

   **b. Carga Inicial de Gadgets (Queries SQL)**

   ```sql
   INSERT INTO DashboardConfigs (config_key, config_value)
   VALUES 
   ('custom_queries', '[{"id":"q-assets","name":"Total de Ativos","sql":"SELECT COUNT(*) as value FROM endpoint","type":"card","color":"#ffffff","headerBgColor":"#0ea5e9","headerTextColor":"#ffffff"},{"id":"q-vulns","name":"Vulnerabilidades","sql":"SELECT SUM(cvecount) as value FROM endpoint","type":"card","color":"#ef4444","headerBgColor":"#dc2626","headerTextColor":"#ffffff"},{"id":"q-risk","name":"Score de Risco","sql":"SELECT 85 as value","type":"card","color":"#eab308","headerBgColor":"#ca8a04","headerTextColor":"#ffffff"},{"id":"q-compliance","name":"% Compliance","sql":"SELECT 92 as value","type":"card","color":"#22c55e","headerBgColor":"#16a34a","headerTextColor":"#ffffff"},{"id":"q-connectivity","name":"Status Conectividade","sql":"SELECT CASE WHEN endpointalive = 1 THEN ''Online'' ELSE ''Offline'' END as name, COUNT(*) as value FROM endpoint GROUP BY endpointalive","type":"pie","colors":["#22c55e","#ef4444"],"headerBgColor":"#111827","headerTextColor":"#0ea5e9"},{"id":"q-os","name":"Sistemas Operacionais","sql":"SELECT operatingsystem as name, COUNT(*) as value FROM endpoint GROUP BY operatingsystem","type":"bar","orientation":"horizontal","colors":["#0ea5e9","#38bdf8","#7dd3fc"],"headerBgColor":"#111827","headerTextColor":"#0ea5e9"},{"id":"q-cve-product-severity","name":"Severidade por Ativo","sql":"SELECT TOP 10 endpointname as name, critical, high, medium, low FROM endpoint ORDER BY critical DESC","type":"bar","isStacked":true,"stackKeys":["critical","high","medium","low"],"colors":["#dc2626","#f97316","#eab308","#0ea5e9"],"headerBgColor":"#111827","headerTextColor":"#0ea5e9"}]'),
   ('custom_pages', '[{"id":"home","name":"Início","icon":"Home","queryIds":["q-assets","q-vulns","q-risk","q-compliance"]},{"id":"overview","name":"Visão Geral","icon":"LayoutDashboard","queryIds":["q-assets","q-vulns","q-connectivity","q-os"]},{"id":"cve_analysis","name":"Dados CVEs","icon":"ShieldAlert","queryIds":["q-vulns","q-cve-product-severity"]},{"id":"insights","name":"Ponto de Atenção","icon":"Info","queryIds":[]}]');
   ```

## Executando a Aplicação

Para iniciar o servidor de desenvolvimento, execute o seguinte comando:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.
