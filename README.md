# YAFA Prompt Orchestration Engine v4.0.0

A production-ready, template-free, cartridge-driven prompt orchestration engine that eliminates static templates and provides comprehensive LLM orchestration capabilities.

## 🚀 Features

### Core Architecture
- **Template-Free Design**: No static templates - all prompt content is generated dynamically
- **Cartridge System**: Plug-and-play domain expertise modules
- **Stateless Compiler**: Orchestrates cartridges without owning domain text
- **Determinism & Provenance**: Reproducible outputs with full run tracking

### Production Features
- **Multi-Provider Support**: OpenAI, Anthropic, and local LLM providers
- **Security & Authentication**: JWT tokens, API keys, rate limiting, quotas
- **Background Jobs**: Asynchronous compilation with BullMQ and Redis
- **Caching & Memoization**: Input hash-based caching with TTL and LRU eviction
- **Observability**: Structured logging, Prometheus metrics, request tracing
- **API Contracts**: OpenAPI 3.0 specification with Swagger UI
- **Cartridge Lifecycle**: Semantic versioning and compatibility management

### Advanced Capabilities
- **SABI Loop**: Sovereign Iterative Loop for prompt refinement
- **Quality Gates**: Automated assessment of clarity, completeness, and determinism
- **Slot Validation**: Dynamic validation of required and optional inputs
- **Export & Persistence**: Multiple formats (JSON, CSV, ZIP) with run manifests

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Layer     │    │  Compiler Core  │    │  Cartridges     │
│                 │    │                 │    │                 │
│ • Express       │◄──►│ • Orchestration │◄──►│ • Domain Logic  │
│ • Middleware    │    │ • Quality Gates │    │ • Prompt Gen    │
│ • Validation    │    │ • Provenance    │    │ • Assessment    │
│ • Security      │    │ • Caching       │    │ • Validation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Infrastructure│    │   Job Queue     │    │   Providers     │
│                 │    │                 │    │                 │
│ • Redis Cache   │    │ • BullMQ        │    │ • OpenAI        │
│ • Logging       │    │ • Background    │    │ • Anthropic     │
│ • Metrics       │    │ • Monitoring    │    │ • Local         │
│ • Storage       │    │ • Retries       │    │ • Cost Tracking │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Redis 6+
- Git

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd yafa-prompt-engine

# Install dependencies
npm install

# Set environment variables
cp env.production .env
# Edit .env with your configuration

# Build the project
npm run build

# Start the server
npm start
```

### Environment Variables
```bash
# Server
NODE_ENV=production
HOST=localhost
PORT=3001

# Security
JWT_SECRET=your-super-secret-jwt-key-here
API_KEY_SALT_ROUNDS=12

# Redis
REDIS_URL=redis://localhost:6379

# LLM Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Features
ENABLE_METRICS=true
ENABLE_SWAGGER=true
```

## 🔧 Usage

### API Endpoints

#### Health Check
```bash
GET /health
```

#### Cartridges
```bash
GET /api/cartridges          # List all cartridges
GET /api/cartridges/:id      # Get cartridge details
```

#### Compilation
```bash
POST /api/compile            # Compile prompt synchronously
POST /api/compile/async      # Compile prompt asynchronously
```

#### Jobs
```bash
GET /api/jobs/:id            # Get job status
POST /api/jobs/:id/cancel    # Cancel job
GET /api/jobs/stats          # Job queue statistics
```

#### Runs & Exports
```bash
GET /api/runs                # List run manifests
GET /api/runs/:id            # Get run details
POST /api/exports            # Export data
```

#### Documentation
```bash
GET /api-docs                # Swagger UI
GET /api-docs.json          # OpenAPI spec
```

### Example Compilation Request
```bash
curl -X POST http://localhost:3001/api/compile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "goal": "Create a professional email to schedule a meeting",
    "yafaOn": true,
    "slots": {
      "recipient": "john.doe@company.com",
      "purpose": "Q4 planning discussion",
      "preferredTime": "next week"
    },
    "requestId": "req-123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Cartridge Development

Create a new cartridge by implementing the Cartridge interface:

```typescript
import { Cartridge } from "../core/cartridge.js";

export const myCartridge: Cartridge = {
  id: "my-domain",
  version: "1.0.0",
  title: "My Domain Expert",
  description: "Expert in my specific domain",
  keywords: ["domain", "expert", "specialist"],
  author: "Your Name",
  license: "MIT",
  compatibility: {
    engine: "yafa",
    minVersion: "4.0.0"
  },
  persona: {
    name: "Domain Expert",
    role: "Specialist",
    voice: "Professional and knowledgeable",
    expertise: ["domain-specific knowledge"],
    background: "Years of experience in the field"
  },
  requiredSlots: ["context", "goal"],
  optionalSlots: ["style", "tone"],
  slotQuestions: {
    context: "What is the context for this request?",
    goal: "What is the main goal?",
    style: "What style should the output have?",
    tone: "What tone should be used?"
  },
  prompts: {
    system: "You are a domain expert...",
    user: "Based on the context: {{context}} and goal: {{goal}}...",
    critic: "Review this output for accuracy and completeness...",
    examples: [
      {
        input: "Context: business meeting, Goal: schedule discussion",
        output: "Professional email template...",
        explanation: "Clear, concise, professional tone"
      }
    ]
  },
  determinism: {
    temperature: 0.7,
    topP: 1,
    maxTokens: 1000
  },
  quality: {
    minClarity: 8,
    minCompleteness: 8,
    minDeterminism: 7,
    minSafety: 9
  },
  builder: {
    schemaBrief: "Structured output format",
    validationRules: ["Must be professional", "Include all required elements"],
    suggestions: ["Consider time zones", "Add follow-up actions"]
  },
  metadata: {
    category: "communication",
    difficulty: "intermediate"
  }
};
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Docker
```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Production
```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start
```

## 📊 Monitoring

### Metrics
- Request rates and latencies
- Error rates and types
- Cache hit/miss ratios
- Job queue performance
- LLM provider costs

### Logging
- Structured JSON logging
- Request ID tracking
- Performance metrics
- Security events
- Error tracking

### Health Checks
- Service health
- Dependency status
- Performance indicators
- Resource usage

## 🔒 Security

- JWT authentication
- API key management
- Rate limiting
- Input validation
- CORS configuration
- Security headers
- Audit logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: `/api-docs`
- Issues: GitHub Issues
- Discussions: GitHub Discussions

## 🗺️ Roadmap

- [ ] CLI tool for local development
- [ ] Cartridge marketplace
- [ ] Advanced analytics dashboard
- [ ] Multi-tenant support
- [ ] Plugin system
- [ ] Mobile SDK
- [ ] Enterprise features

---

**YAFA Engine** - Where prompts orchestrate themselves, not the other way around.
