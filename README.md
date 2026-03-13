# Food Nutrition

## Prerequisites

- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)

## Setup

1. Copy the example environment file and edit as needed:

   ```sh
   cp .env.dev .env
   ```

2. Start the services:

   ```sh
   docker compose up -d
   ```

   This starts:
   - **PostgreSQL** (`postgres:18.3`) on port `5432`
   - **Adminer** (`adminer:5.3.0`) on port `8080`

3. Access Adminer at [http://localhost:8080](http://localhost:8080) to manage the database.

## Environment Variables

| Variable      | Description              |
|---------------|--------------------------|
| `DB_USER`     | PostgreSQL username       |
| `DB_PASSWORD` | PostgreSQL password       |
| `DB_NAME`     | PostgreSQL database name  |
| `DB_URL`      | Full database connection URL |

## Stopping

```sh
docker compose down
```

To also remove volumes (database data):

```sh
docker compose down -v
```
