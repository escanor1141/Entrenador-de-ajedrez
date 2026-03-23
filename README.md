# LotusChess Analyzer

Chess opening analyzer that connects to Lichess API to extract user game history and provide detailed opening statistics.

## Features

- **Dashboard de Estadísticas**: Winrate global, distribución de aperturas, rendimiento por color
- **Análisis por Apertura**: Vista detallada con tablero interactivo y árbol de movimientos
- **Opening Explorer**: Tree view de todas las líneas jugadas con winrate en cada nodo
- **Heatmap de Errores**: Visualización de errores por fase del juego
- **Motor Stockfish**: Integración con Stockfish.js para evaluación en tiempo real
- **Recomendador de Líneas**: Sugerencias basadas en peor rendimiento

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS
- **Chess**: react-chessboard + chess.js
- **State Management**: Zustand + React Query
- **Database**: PostgreSQL + Prisma ORM
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (optional for development without DB)

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

### Development without Database

The app can run without a database - it will fetch data directly from Lichess API.
Simply use the `.env.example` without modifying it.

## API Endpoints

- `GET /api/users/[username]` - User data from Lichess
- `GET /api/games/[username]` - User's games with filters
- `GET /api/openings/[username]` - Aggregated opening statistics
- `GET /api/openings/[username]/[eco]` - Detailed stats for specific opening

## Pages

- `/` - Landing page with username search
- `/dashboard/[username]` - Main dashboard with statistics
- `/openings/[username]` - Opening detail view

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lotus_chess?schema=public"
```

## License

MIT
