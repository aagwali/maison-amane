# Maison Amane

A DDD-based hexagonal architecture application built with Effect-TS.

## Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0
- Docker & Docker Compose

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd maison-amane
   ```

2. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

3. **Start Docker services**

   ```bash
   docker-compose up -d
   ```

   This will start:
   - MongoDB (port 27017)
   - Mongo Express UI (port 8081)
   - RabbitMQ (port 5672, Management UI on 15672)

4. **Install dependencies**

   ```bash
   pnpm install
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

## Documentation

For detailed documentation, see the [documentation site](apps/docs) or run it locally:

```bash
cd apps/docs
pnpm dev
```

The documentation will be available at http://localhost:3000
