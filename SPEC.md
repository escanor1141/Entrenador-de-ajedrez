# LotusChess Analyzer - Especificación Técnica

## 1. Concepto & Visión

**LotusChess Analyzer** es una herramienta de análisis de ajedrez que transforma datos crudos de Lichess en información procesable. La aplicación se siente como un entrenador personal de ajedrez: inteligente, oscura, elegante y enfocada en patrones.

## 2. Design Language

### Color Palette
- Background Primary: #0D0D0F
- Background Secondary: #1A1A1F
- Background Tertiary: #252529
- Text Primary: #F5F5F7
- Text Secondary: #9CA3AF
- Accent Green (victoria): #10B981
- Accent Red (derrota): #EF4444
- Accent Yellow (tablas): #F59E0B
- Accent Blue (interacciones): #3B82F6

### Typography
- Headings: Inter (700, 600)
- Body: Inter (400, 500)
- Monospace: JetBrains Mono

## 3. Stack Tecnológico
- Frontend: Next.js 14 (App Router) + React 18
- Styling: Tailwind CSS 3.4
- Chess: react-chessboard + chess.js
- State: Zustand + React Query
- Database: PostgreSQL + Prisma ORM
- Charts: Recharts

## 4. API Endpoints
- GET /api/users/[username] - Datos de usuario
- GET /api/games/[username] - Partidas del usuario
- GET /api/openings/[username] - Estadísticas de aperturas
- GET /api/openings/[username]/[eco] - Detalle por apertura

## 5. Data Model
- User: lichessId, username, cachedAt
- Game: lichessId, pgn, white, black, result, eco, openingName, moves
- OpeningStats: eco, name, totalGames, wins, draws, losses
