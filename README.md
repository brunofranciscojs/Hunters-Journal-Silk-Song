# Hornet's Hunter's Journal

Uma aplicação web interativa que replica a estética do jogo Hollow Knight - Silk Song, fornecendo informações detalhadas sobre todos os inimigos do jogo através de uma interface imersiva e fiel ao design original.

![Hollow Knight](https://hollowknight.wiki/images/thumb/b/b2/Knight_Idle.png/200px-Knight_Idle.png)

## Sobre o Projeto

Este projeto combina uma API customizada de web scraping com uma interface de usuário inspirada na estética sombria e atmosférica de Hollow Knight. A aplicação permite aos jogadores explorar informações detalhadas sobre os inimigos do jogo de forma visualmente atraente e intuitiva.

### Características Principais

-  **Interface Fiel ao Jogo**: Design inspirado na UI original de Hollow Knight
-  **Database Completa**: Informações sobre todos os inimigos do jogo
-  **Performance Otimizada**: Cache inteligente e carregamento eficiente
-  **Responsivo**: Funciona perfeitamente em desktop e mobile

## Tecnologias Utilizadas

### Frontend
- **React**: Biblioteca para construção da interface
- **Tailwind CSS**: Estilização utilitária e responsiva
- **Fetch API**: Requisições assíncronas

### Backend (API)
- **Node.js + Express**: Servidor web
- **Cheerio**: Web scraping do Hollow Knight Wiki
- **CORS**: Habilitação de requisições cross-origin
- **Render.com**: Deployment e hospedagem da API

## Arquitetura

### API de Web Scraping

A API faz scraping do [Hollow Knight Wiki](https://hollowknight.wiki) para extrair informações atualizadas sobre os inimigos:

```
GET /api/enemies
```
Retorna lista completa de inimigos com informações básicas.

```
GET /api/enemies/:slug
```
Retorna detalhes completos de um inimigo específico, incluindo:
- Nome e slug
- Imagem
- Descrição do jogo
- Descrição da Hornet (Silksong)
- Stats (vida, dano, localização)
- URL da página wiki

#### Exemplo de Resposta

```json
{
  "cached": false,
  "slug": "vengefly",
  "name": "Vengefly",
  "url": "https://hollowknight.wiki/w/Vengefly",
  "description": "Aggressive plant-life that retracts protectively when danger is near.",
  "hornetDescription": "...",
  "image": "https://cdn.wikimg.net/en/hkwiki/images/...",
  "stats": {
    "health": "7",
    "damage": "1",
    "location": "King's Pass, Forgotten Crossroads, Greenpath",
    "game": "Hollow Knight"
  }
}
```

### Sistema de Cache

A API implementa um sistema de cache em memória para:
- Reduzir carga no servidor wiki
- Melhorar tempo de resposta
- Otimizar uso de recursos

### Extração Inteligente de Dados

A API utiliza técnicas avançadas de parsing para extrair informações:

1. **Tabelas de Infobox**: Extrai stats estruturados
2. **Localizações**:
   - Prioriza tabelas de localização quando disponíveis
   - Extrai links de áreas do primeiro parágrafo
   - Fallback para regex patterns
   - Remove avisos e metadados `[missing information]`
3. **Imagens**: CDN URLs otimizadas
4. **Descrições**: Text mining de parágrafos específicos

## Deploy

### API (Render.com)

A API está hospedada no Render.com com as seguintes configurações:

**URL da API**: `https://your-api.onrender.com`

#### Configuração do Render

```yaml
# render.yaml
services:
  - type: web
    name: hollow-knight-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/enemies
    autoDeploy: true
```

#### Variáveis de Ambiente

```bash
NODE_ENV=production
PORT=3000
```

### Frontend

O frontend pode ser deployado em:
- Vercel
- Netlify
- GitHub Pages
- Render.com

## Instalação Local

### Pré-requisitos

- Node.js 16+
- npm ou yarn

### API

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/hollow-knight-api.git
cd hollow-knight-api

# Instale as dependências
npm install

# Inicie o servidor
npm start

# Servidor rodando em http://localhost:3000
```

### Frontend

```bash
# Clone o repositório do frontend
git clone https://github.com/seu-usuario/hollow-knight-ui.git
cd hollow-knight-ui

# Instale as dependências
npm install

# Configure a URL da API
# Crie um arquivo .env
echo "REACT_APP_API_URL=http://localhost:3000" > .env

# Inicie o desenvolvimento
npm start

# Aplicação rodando em http://localhost:3000
```

## Estrutura do Projeto

```
hollow-knight-wiki/
├── api/
│   ├── server.js              # Servidor Express
│   ├── routes/
│   │   └── enemies.js         # Rotas da API
│   ├── scrapers/
│   │   ├── enemyList.js       # Scraper lista de inimigos
│   │   └── enemyDetails.js    # Scraper detalhes
│   ├── utils/
│   │   ├── cache.js           # Sistema de cache
│   │   └── parser.js          # Parsers HTML
│   └── package.json
│
└── ui/
    ├── src/
    │   ├── components/
    │   │   ├── EnemyList.jsx      # Lista de inimigos
    │   │   ├── EnemyDetail.jsx    # Detalhes do inimigo
    │   │   └── LocationGroup.jsx  # Agrupamento por local
    │   ├── hooks/
    │   │   └── useEnemies.js      # Hook customizado
    │   ├── styles/
    │   │   └── hollowknight.css   # Tema do jogo
    │   └── App.jsx
    └── package.json
```

## Design System

### Paleta de Cores

Inspirada na atmosfera sombria de Hallownest:

```css
/* Cores principais */
--hk-dark: #0a0a0a;        /* Fundo escuro */
--hk-void: #1a1a1a;        /* Elementos escuros */
--hk-white: #e8e8e8;       /* Texto claro */
--hk-soul: #7fc8f8;        /* Azul alma */
--hk-infected: #ff8c00;    /* Laranja infecção */
--hk-shade: #333333;       /* Cinza sombra */
```

### Tipografia

- **Fonte Principal**: Trajan Pro (inspirada no jogo)
- **Fonte Secundária**: Perpetua Titling MT

### Componentes UI

- Bordas arredondadas e sombreamento suave
- Transições suaves ao hover
- Efeitos de brilho e saturação
- Layout responsivo inspirado no HUD do jogo

## Fluxo de Dados

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  React Frontend │
│  (Tailwind CSS) │
└────────┬────────┘
         │
         │ HTTP Request
         ▼
┌──────────────────┐
│   API Express    │
│   (Render.com)   │
└────────┬─────────┘
         │
         │ Cache Miss?
         ▼
┌──────────────────┐
│  Cheerio Scraper │
└────────┬─────────┘
         │
         │ Parse HTML
         ▼
┌──────────────────┐
│ Hollow Knight    │
│     Wiki         │
└──────────────────┘
```

## Features da API

### Sistema de Localização Inteligente

A API implementa múltiplas estratégias para extrair localizações:

1. **Tabelas estruturadas**: Parser de tabelas HTML
2. **Links no texto**: Extração de tags `<a>`
3. **Regex patterns**: Busca por palavras-chave (in, at, on)
4. **Limpeza automática**: Remove avisos e metadados

### Tratamento de Múltiplas Localizações

Inimigos podem aparecer em várias áreas:

```javascript
// Exemplo: "Mosshome, Bone Bottom, Shellwood"
// UI agrupa pela localização primária
// Tooltip mostra todas as localizações
```

## Troubleshooting

### API não responde

```bash
# Verifique os logs no Render
render logs -a hollow-knight-api

# Teste localmente
curl http://localhost:3000/api/enemies
```

### Erros de CORS

Certifique-se de que o frontend está configurado corretamente:

```javascript
// Configure a URL da API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

## Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## Licença

Este projeto é apenas para fins educacionais. Hollow Knight é propriedade da Team Cherry.

## Créditos

- **Team Cherry**: Criadores do Hollow Knight
- **Hollow Knight Wiki**: Fonte de dados
- **Comunidade**: Contribuidores e testers

## Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

---
 *Feito com 🖤 por um fã de Hollow Knight*
