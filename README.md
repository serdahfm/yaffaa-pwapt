# YAFA-MS vNext

Yet Another Framework Agnostic Mission Solver - A mission execution platform that transforms objectives into actionable deliverables.

## Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start development servers (frontend on :3000, backend on :3001)
npm run dev

# Open http://localhost:3000 in your browser
```

### Production Mode (Docker)

```bash
# Build and start with Docker Compose
docker-compose up -d

# Open http://localhost:3001 in your browser
```

## Features

- **Mission Planning**: Transform mission statements into structured execution plans
- **YAFA Protocol**: Enhanced validation for high-stakes missions
- **Real-time Execution**: Monitor progress with live updates
- **File Generation**: Automatic creation of business documents, plans, and presentations
- **Zero-service Architecture**: Single container deployment with built-in SPA serving

## Architecture

```
├── web/                 # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui inspired)
│   │   └── App.tsx      # Main application
│   └── dist/            # Built frontend (served by backend in production)
│
├── server/              # TypeScript + Fastify backend
│   ├── src/
│   │   ├── engine/      # YAFA-MS execution engine
│   │   ├── services/    # Job management services
│   │   └── database/    # SQLite database setup
│   └── dist/            # Compiled backend
│
└── data/                # SQLite database storage
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/plan` - Generate execution plan
- `POST /api/execute` - Start mission execution
- `GET /api/results/:runId` - Get execution status and results
- `GET /api/download/:runId` - Download results as ZIP

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3001)
- `DB_PATH` - Database file path (default: ./data/yafa.db)
- `CORS_ORIGINS` - Allowed origins (default: http://localhost:3000)
- `LOG_LEVEL` - Logging level (default: info)

## Testing

```bash
# Run smoke tests
npm test

# Or directly
bash scripts/smoke-test.sh
```

## Development

### Adding UI Components

The project uses a shadcn/ui-inspired component system. Components are in `web/src/components/ui/`.

### Extending the Engine

The YAFA engine (`server/src/engine/yafa-engine.ts`) can be extended to support new mission types and deliverables.

## Deployment

The application is designed for simple deployment:

1. **Single Container**: Both frontend and backend served from port 3001
2. **Persistent Storage**: SQLite database in Docker volume
3. **Health Checks**: Built-in health monitoring
4. **Auto-restart**: Configured for high availability

## License

MIT
