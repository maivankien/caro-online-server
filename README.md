<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Caro Online Server

Server backend cho game Caro Online được xây dựng với NestJS framework.

## Mô tả

Caro Online là một game cờ caro trực tuyến cho phép người chơi tạo phòng và chơi với nhau. Server cung cấp các API để:

- Xác thực người dùng (guest users)
- Quản lý phòng chơi
- Xử lý logic game cờ caro

## Cài đặt

```bash
$ yarn install
```

## Cấu hình

Sao chép file `.env.example` thành `.env` và cấu hình các biến môi trường:

```bash
$ cp .env.example .env
```

## Chạy ứng dụng

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod

# development với thông báo Swagger
$ yarn run start:swagger
```

## API Documentation (Swagger)

Sau khi khởi động server, truy cập Swagger UI tại:

```
http://localhost:3000/api/docs
```

### Tính năng Swagger:
- **Interactive API Testing**: Test trực tiếp các endpoint
- **Global JWT Authentication**: JWT auth tự động áp dụng cho tất cả endpoints
- **One-click Authorization**: Authorize một lần cho toàn bộ session
- **Request/Response Examples**: Ví dụ chi tiết cho mọi endpoint
- **Validation Documentation**: Mô tả các rule validation
- **Auto Security Indicators**: Lock icon cho protected endpoints

Xem thêm chi tiết tại [docs/SWAGGER.md](docs/SWAGGER.md)

## API Endpoints

### Authentication
- `POST /api/auth/guest` - Tạo guest user và nhận JWT token (public)
- `GET /api/auth/profile` - Lấy thông tin profile người dùng (protected)

### Rooms
- `POST /api/rooms` - Tạo phòng chơi mới (protected)
- `POST /api/rooms/join` - Tham gia phòng chơi (protected)
- `GET /api/rooms` - Lấy danh sách phòng chơi (protected)

## Cấu trúc dự án

```
src/
├── common/           # Shared utilities, decorators, filters
├── config/           # Configuration modules
├── modules/          # Feature modules
│   ├── auth/         # Authentication module
│   ├── user/         # User management module
│   ├── room/         # Room management module
│   ├── game/         # Game logic module (coming soon)
│   └── matchmaking/  # Matchmaking module (coming soon)
├── providers/        # Database and external service providers
└── main.ts          # Application entry point
```

## Testing

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Coding Standards

- **No semicolons**: Trừ import statements
- **4 spaces indentation**: Sử dụng 4 spaces cho indentation
- **Interface naming**: Interfaces phải có prefix `I` (ví dụ: `IResponse`)

## Technology Stack

- **Framework**: NestJS
- **Database**: MySQL với TypeORM
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Language**: TypeScript

## License

[MIT licensed](LICENSE).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)
