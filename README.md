# Caro Online Server

A comprehensive multiplayer Caro (Gomoku) game server built with NestJS, featuring real-time gameplay, AI opponents, intelligent matchmaking, and WebSocket communication.

## Description

Caro Online Server is a robust backend system that powers an online multiplayer Caro game platform. The server provides real-time gameplay experiences with features including human vs human matches, AI opponents with advanced board evaluation algorithms, ELO-based matchmaking system, and comprehensive room management. Built with modern technologies and designed for scalability, it supports both REST API and WebSocket connections for seamless gaming experiences.

## Related Projects

- **Frontend**: [Caro Online Frontend](https://github.com/maivankien/caro-online-client) - React-based web client

## Features

### 🎮 **Core Game Features**
- **Real-time Multiplayer**: WebSocket-based real-time gameplay with instant move synchronization
- **AI Opponent**: Advanced AI with intelligent board evaluation and strategic move calculation
- **Multiple Game Modes**: Human vs Human, Human vs AI gameplay options
- **Customizable Game Settings**: Configurable board sizes (5x5 to 20x20) and win conditions (3-7 consecutive pieces)
- **Rematch System**: Seamless rematch functionality for continuous gameplay

### 🏆 **Matchmaking & Ranking**
- **ELO-based Matchmaking**: Intelligent player matching based on skill ratings
- **Progressive Range Search**: Dynamic ELO range expansion for optimal match quality
- **Timeout Handling**: Automatic cleanup and timeout management for queue operations
- **Skill-based Pairing**: Ensures fair and competitive matches

### 🏠 **Room Management**
- **Custom Rooms**: User-created rooms with password protection
- **AI Rooms**: Instant single-player vs AI game creation
- **Matchmaking Rooms**: Auto-created rooms for matched players
- **Real-time Room Updates**: Live room status and player management

### 🔐 **Authentication & Security**
- **JWT Authentication**: Secure token-based authentication for both HTTP and WebSocket
- **Guest User Support**: Quick access without registration requirements
- **User Registration**: Full user account management with email/password
- **Multi-protocol Support**: Unified authentication across REST API and WebSocket

### ⚡ **Performance & Scalability**
- **Redis-based State Management**: Fast and scalable game state storage
- **Distributed Locking**: Race condition prevention in multi-instance deployments
- **Event-driven Architecture**: Efficient real-time communication
- **Horizontal Scaling**: Designed for load balancing and scaling

## Getting Started

### Prerequisites

**For Docker Setup (Recommended):**
- Docker and Docker Compose

**For Manual Setup:**
- Node.js (v18 or higher)
- Yarn package manager
- MySQL database
- Redis server

### Environment Configuration

The project includes a `.env.example` file that contains all required environment variables with example values. This file serves as a template for your local configuration.

**Key Environment Variables:**
- **Database**: MySQL connection settings
- **Redis**: Cache and session storage configuration  
- **JWT**: Authentication token settings
- **Application**: Server port and environment mode

**Security Note:** Always change the `JWT_SECRET` value in production environments.

### Quick Start with Docker (Recommended)

This is the fastest way to get the application running with all dependencies.

#### 1. Clone the Repository
```bash
git clone https://github.com/maivankien/caro-online-server.git
cd caro-online-server
```

#### 2. Environment Configuration
Create a `.env` file from the example template:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```bash
# Edit the .env file with your preferred editor
nano .env
# or
vim .env
# or
code .env
```

**Required Configuration:**
- Update `JWT_SECRET` with a secure random string
- Adjust database credentials if needed
- Modify Redis settings if using external Redis

> **Note:** See `.env.example` file for all available environment variables and their descriptions.

#### 3. Start the Application
```bash
# Start all services (app, MySQL, Redis)
docker-compose up -d

# View application logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

#### 4. Verify Installation
Once started, you can access:
- **API**: `http://localhost:3000/api`
- **Swagger Documentation**: `http://localhost:3000/api/docs`
- **MySQL**: `localhost:3307` (external port)
- **Redis**: `localhost:6379`

### Docker Architecture

The application uses Docker Compose with three main services:

- **MySQL Database** (`mysql`): Stores user data, game rooms, and game history
- **Redis Cache** (`redis`): Handles real-time data and session storage
- **NestJS Application** (`app`): Backend API server with WebSocket support

**Key Features:**
- Multi-stage Docker build for optimized image size
- Health checks for MySQL and Redis
- Volume mounting for data persistence
- Network isolation with custom bridge network
- Automatic dependency management

### Manual Installation (Development)

For development purposes or when you prefer to run services locally.

#### 1. Install Dependencies
```bash
yarn install
```

#### 2. Environment Configuration
Create a `.env` file from the example template:
```bash
cp .env.example .env
```

Edit the `.env` file with your local configuration:
```bash
# Edit the .env file with your preferred editor
nano .env
# or
vim .env
# or
code .env
```

**Required Configuration for Local Development:**
- Update database credentials to match your local MySQL setup
- Configure Redis connection for your local Redis instance
- Set a secure `JWT_SECRET` for authentication
- Adjust `NODE_ENV` to `development`

> **Note:** See `.env.example` file for all available environment variables and their descriptions.

#### 3. Database Setup
```bash
# Run database migrations
yarn migration:run
```

#### 4. Start External Services
**Start Redis:**
```bash
# Ubuntu/Debian
sudo systemctl start redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:alpine
```

**Start MySQL:**
```bash
# Ubuntu/Debian
sudo systemctl start mysql

# Or with Docker
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0
```

#### 5. Run the Application
```bash
# Development mode with hot reload
yarn start:dev

# Production mode
yarn build
yarn start:prod
```

#### 6. Access the Application
- **Swagger UI**: `http://localhost:3000/api/docs`
- **API Base URL**: `http://localhost:3000/api`

## Project Structure

```
caro-online-server/
├── src/
│   ├── common/                   # Shared utilities and services
│   │   ├── constants/            # Application constants
│   │   ├── decorators/           # Custom decorators
│   │   ├── enums/                # TypeScript enums
│   │   ├── filters/              # Exception filters
│   │   ├── interceptors/         # Response interceptors
│   │   └── services/             # Shared services (ELO, Lock)
│   ├── config/                   # Configuration modules
│   │   └── app/                  # Application configuration
│   ├── modules/                  # Feature modules
│   │   ├── ai/                   # AI service and game logic
│   │   ├── auth/                 # Authentication and authorization
│   │   ├── game/                 # Core game logic and WebSocket
│   │   ├── game-queue/           # Background job processing
│   │   ├── matchmaking/          # Player matching system
│   │   ├── room/                 # Room management
│   │   └── user/                 # User management
│   ├── providers/                # External service providers
│   │   ├── cache/redis/          # Redis configuration
│   │   ├── database/mysql/       # MySQL database setup
│   │   └── queue/bullmq/         # Background job queue
│   ├── app.module.ts             # Main application module
│   └── main.ts                   # Application entry point
├── docs/                         # Documentation
│   ├── ai/                       # AI service documentation
│   ├── auth/                     # Authentication documentation
│   ├── game/                     # Game service documentation
│   ├── matchmaking/              # Matchmaking documentation
│   └── room/                     # Room module documentation
├── dist/                         # Compiled JavaScript output
├── test/                         # Test files
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Tech Stack

### **Backend Framework**
- **NestJS**: Progressive Node.js framework for building scalable server-side applications
- **TypeScript**: Type-safe JavaScript with enhanced developer experience
- **Express**: Fast, unopinionated web framework for Node.js

### **Database & Caching**
- **MySQL**: Relational database for persistent data storage
- **TypeORM**: Object-Relational Mapping for database operations
- **Redis**: In-memory data store for caching and real-time data

### **Authentication & Security**
- **JWT (JSON Web Tokens)**: Secure token-based authentication
- **Passport.js**: Authentication middleware for Node.js
- **bcrypt**: Password hashing and verification

### **Real-time Communication**
- **Socket.IO**: Real-time bidirectional event-based communication
- **WebSockets**: Low-latency communication protocol

### **Background Processing**
- **BullMQ**: Redis-based message queue for background jobs
- **@nestjs/schedule**: Task scheduling and cron jobs

### **API Documentation**
- **Swagger/OpenAPI**: Interactive API documentation
- **@nestjs/swagger**: Swagger integration for NestJS

### **Additional Libraries**
- **class-validator**: Decorator-based validation
- **class-transformer**: Object transformation utilities
- **uuid**: UUID generation for unique identifiers
- **ioredis**: High-performance Redis client

## API Endpoints

### **Authentication**
- `POST /api/auth/guest` - Create guest user
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification
- `GET /api/auth/profile` - User profile

### **Room Management**
- `POST /api/rooms` - Create custom room
- `POST /api/rooms/ai` - Create AI room
- `POST /api/rooms/join` - Join room
- `GET /api/rooms` - Get room list
- `GET /api/rooms/:id` - Get room details

## Development

### Docker Commands

**Basic Operations:**
```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d mysql redis

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build -d
```

**Monitoring and Debugging:**
```bash
# View logs
docker-compose logs -f app
docker-compose logs -f mysql
docker-compose logs -f redis

# Check service status
docker-compose ps

# Execute commands in containers
docker-compose exec app bash
docker-compose exec mysql mysql -u caro_user -p caro_online
docker-compose exec redis redis-cli
```

### Available Scripts

**Development:**
```bash
yarn start:dev          # Start with hot reload
yarn start:debug        # Start with debugging
```

**Building:**
```bash
yarn build              # Build for production
yarn start:prod         # Start production build
```

**Docker:**
```bash
docker-compose up -d    # Start with Docker
docker-compose down      # Stop Docker services
```


**Local Development:**
```bash
yarn migration:run
yarn migration:revert
yarn migration:create -n MigrationName
```

## Troubleshooting

### Common Issues

#### Port Conflicts
If you encounter port conflicts:
```bash
# Check if ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :3307
netstat -tulpn | grep :6379

# Stop conflicting services or change ports in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check MySQL container status
docker-compose logs mysql

# Test MySQL connection
docker-compose exec mysql mysql -u caro_user -p caro_online
```

#### Redis Connection Issues
```bash
# Check Redis container status
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### Application Startup Issues
```bash
# Check application logs
docker-compose logs app

# Rebuild application container
docker-compose up --build -d app
```

#### Clean Restart
If you need to start fresh:
```bash
# Stop all services and remove containers
docker-compose down

# Start fresh
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

