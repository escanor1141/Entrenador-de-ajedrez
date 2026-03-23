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

### Testing local

```bash
npm test
npm run test:watch
npx tsc --noEmit
npx eslint src/lib/gameFilters.ts src/lib/openings.ts src/lib/training-engine.ts tests/lib/*.test.ts
```

Los tests corren con Vitest en entorno Node, sin red y sin depender de Lichess.

### DB setup + smoke comments API

```bash
npm run db:setup
npm run test:smoke:comments
```

- `db:setup` genera Prisma Client y aplica el schema a la DB local con `prisma db push`.
- `test:smoke:comments` valida el contrato HTTP de `GET`, `POST` y `DELETE` para comentarios de variantes.
- Si tocás el schema, corré también `npx tsc --noEmit` y el lint sobre los archivos modificados.

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

## Releases

Para cortar una release nueva:

```bash
git tag vX.Y.Z && git push origin vX.Y.Z
```

Al pushear un tag `v*`, GitHub Actions crea la release automáticamente con notas generadas.

## CI en PR

En cada `pull_request` hacia `main`, GitHub Actions valida:

- Instalación limpia con `npm ci`
- Tests con `npm test`
- Typecheck con `npx tsc --noEmit`
- Lint con `npx eslint src tests --ext .ts,.tsx --max-warnings=0`

Se usa ESLint CLI directa en CI para evitar el comportamiento interactivo/deprecado de `next lint`.

## License

MIT
