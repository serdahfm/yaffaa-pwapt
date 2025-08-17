# YAFA Perfect Prompt Generator

> **Template-Free, Production-Ready Prompt Engineering Engine**

A unified, production-ready prompt generation system that combines the best of both the original YAFA repository and the re-architected system.

## 🚀 What This Repository Contains

This repository is the result of merging two complementary codebases:

### From the Re-Architected System (`src/`)
- **Template-Free Architecture**: No static templates - all domain expertise is embedded directly in cartridges
- **Production Features**: Security, authentication, caching, job queues, observability
- **Multi-Provider Support**: OpenAI, Anthropic, and local LLM providers
- **Enhanced Cartridge System**: Versioning, compatibility checks, structured prompts
- **API-First Design**: RESTful API with OpenAPI documentation

### From the Original YAFA Repository (`packages/`, `apps/`, `infra/`)
- **Domain Expertise**: Pre-built cartridges for chemistry, executive, and other domains
- **Testing Infrastructure**: Production testing scripts and evaluation harness
- **Deployment Tools**: Docker, nginx, and infrastructure configurations
- **Monorepo Structure**: Organized packages for different components

## 🏗️ Architecture

```
Yafa-Prompts/
├── src/                    # Core engine (re-architected)
│   ├── core/              # Cartridge system & compiler
│   ├── lib/               # Utilities & services
│   ├── api/               # REST API server
│   └── cartridges/        # Domain-specific cartridges
├── packages/               # Modular components
│   ├── compiler/          # Standalone compiler package
│   └── domain-packs/      # Domain expertise libraries
├── apps/                   # Application examples
│   ├── api/               # API server example
│   └── web/               # Web interface example
├── infra/                  # Infrastructure & deployment
└── scripts/                # Utility scripts
```

## 🎯 Key Features

### Core Engine
- **Template-Free Generation**: Domain expertise embedded in cartridges
- **Stateless Compiler**: Orchestrates cartridge experts without owning domain text
- **Cartridge Registry**: Dynamic loading and compatibility management
- **SABI Loop**: Sovereign Iterative Loop for prompt refinement

### Production Ready
- **Security**: JWT authentication, API keys, rate limiting
- **Observability**: Structured logging, metrics, request tracing
- **Scalability**: Background jobs, caching, async processing
- **API Contracts**: OpenAPI 3.0, typed SDK, Postman collection

### Domain Expertise
- **Chemistry**: Scientific writing, research methodology
- **Executive**: Business strategy, leadership communication
- **Extensible**: Easy to add new domains via cartridge system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Redis (for production features)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd Yafa-Prompts

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Build the project
npm run build

# Start development server
npm run dev
```

### Environment Variables
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key
API_KEY_SALT=your-salt

# LLM Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Redis (for production features)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 📚 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /cartridges` - List available cartridges
- `POST /compile` - Generate prompt from task
- `POST /sabi` - SABI loop iteration

### Management Endpoints
- `GET /api/cartridges/{id}` - Get cartridge details
- `POST /api/compile?async=true` - Async compilation
- `GET /api/jobs/{jobId}` - Job status
- `GET /api/runs` - Compilation history
- `GET /metrics` - Prometheus metrics

## 🔧 Development

### Adding New Domains
1. Create a new cartridge file in `src/cartridges/`
2. Define domain expertise, persona, and examples
3. Register in the cartridge registry
4. Test with the API

### Building
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm run test

# Production build
npm run build
```

### Docker
```bash
# Build image
docker build -t yafa-prompts .

# Run container
docker run -p 3000:3000 yafa-prompts
```

## �� Testing

### Production Testing
```bash
# Run production test suite
./test-production.sh
```

### Evaluation Harness
The system includes an evaluation framework for testing cartridge performance and prompt quality.

## 🚀 Deployment

### Docker Compose
```bash
docker-compose up -d
```

### Production Considerations
- Use Redis for caching and job queues
- Set up proper logging and monitoring
- Configure rate limiting and security headers
- Use environment-specific configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions and support:
- Check the documentation
- Review existing issues
- Create a new issue with details

## 🔄 Migration from Old Repositories

If you're migrating from either the old YAFA repository or the YAFA_MS repository:

1. **Backup your data** before migration
2. **Review the new architecture** - it's significantly different
3. **Update your integrations** to use the new API endpoints
4. **Test thoroughly** with your use cases

The new system maintains backward compatibility where possible but introduces significant improvements in architecture and features.

---

**Built with ❤️ by the YAFA Team**
