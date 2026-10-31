# Thali: Backend

REST API for **Thali**, a recipe sharing app. Users can sign up, log in, browse recipes, and add, edit or delete their own recipes with a cover image.

Built with **Node.js, Express and MongoDB**. API docs are available through **Swagger**.

## Live API

| What         | Link                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| Swagger docs | [thali-backend-8kz7.onrender.com/api-docs](https://thali-backend-8kz7.onrender.com/api-docs) |
| Base URL     | `https://thali-backend-8kz7.onrender.com`                                                    |

> If the server has been idle, the first request can take a little while to respond while it wakes up.

## Features

- Sign up and log in with **JWT** authentication (token valid for 1 day)
- Passwords hashed with **bcrypt**
- **Logout with a token blacklist**. A logged-out token cannot be used again, and expired entries are removed automatically from MongoDB (TTL index)
- Public recipe listing, newest first
- Add, edit and delete recipes, **only the owner** can change or delete their own recipe
- **Image upload** with Multer (JPG, PNG, WebP, GIF, max 5 MB), saved to `public/images`
- Old image is removed when a recipe is deleted or its image is replaced
- Input checks: valid ObjectId, required fields, image type and size
- **Swagger UI** at `/api-docs`

## Tech stack

- Node.js and Express
- MongoDB with Mongoose
- jsonwebtoken and bcrypt
- Multer (file uploads)
- dotenv and cors
- swagger-ui-express

## Getting started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database (local or MongoDB Atlas)

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
PORT=8000
SECRET_KEY=your_long_random_secret
CONNECTION_STRING=mongodb://127.0.0.1:27017/thali
```

| Variable            | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `PORT`              | Port the server runs on (default 3000 if not set) |
| `SECRET_KEY`        | Secret used to sign and verify JWT tokens         |
| `CONNECTION_STRING` | MongoDB connection URL                            |

> The name of the MongoDB variable must match the one used in `config/connectionDb.js`. If you named it differently (for example `MONGO_URI`), use that name instead.

The React frontend expects the API at `http://localhost:8000` when running locally, so keep `PORT=8000`.

### Run

```bash
node index.js
```

Or with auto restart on file changes (if you use nodemon):

```bash
npx nodemon index.js
```

You should see:

```
App is listening on port 8000
Swagger docs: http://localhost:8000/api-docs
```

## API documentation

| Environment | Swagger docs                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Live        | [https://thali-backend-8kz7.onrender.com/api-docs](https://thali-backend-8kz7.onrender.com/api-docs) |
| Local       | http://localhost:8000/api-docs                                                                       |

Open the link to see and try every endpoint.

To test protected routes:

1. Use `POST /login` (or `/signUp`) and copy the `token` from the response.
2. Click **Authorize** and paste the token. Do not type the word `Bearer`.
3. Protected endpoints now work.

## Endpoints

| Method | Endpoint      | Auth | Description                               |
| ------ | ------------- | ---- | ----------------------------------------- |
| POST   | `/signUp`     | No   | Create an account, returns token and user |
| POST   | `/login`      | No   | Log in, returns token and user            |
| POST   | `/logout`     | Yes  | Log out and blacklist the current token   |
| GET    | `/user/:id`   | Yes  | Get a user's email by id                  |
| GET    | `/recipe`     | No   | Get all recipes, newest first             |
| GET    | `/recipe/:id` | No   | Get one recipe                            |
| POST   | `/recipe`     | Yes  | Add a recipe (multipart form)             |
| PUT    | `/recipe/:id` | Yes  | Edit your own recipe (multipart form)     |
| DELETE | `/recipe/:id` | Yes  | Delete your own recipe                    |

Protected routes need this header:

```
Authorization: Bearer <token>
```

### Recipe form fields (`POST /recipe` and `PUT /recipe/:id`)

Sent as `multipart/form-data`:

| Field          | Type            | Notes                                               |
| -------------- | --------------- | --------------------------------------------------- |
| `title`        | text            | Required when adding                                |
| `ingredients`  | text (repeated) | Required when adding. Send one field per ingredient |
| `instructions` | text            | Required when adding. One step per line             |
| `time`         | text            | Optional, for example `35 min`                      |
| `file`         | image           | Optional cover image, max 5 MB                      |

When editing, only the fields you send are changed.

### Images

Uploaded images are served as static files:

```
https://thali-backend-8kz7.onrender.com/images/<coverImage>
```

Locally: `http://localhost:8000/images/<coverImage>`

## Project structure

```
.
├── config/
│   └── connectionDb.js       # MongoDB connection
├── controller/
│   ├── recipe.js             # recipe logic and image upload
│   └── user.js               # sign up, login, logout, get user
├── middleware/
│   └── auth.js               # verifyToken (JWT check and blacklist check)
├── models/
│   ├── blacklistedToken.js   # logged-out tokens (TTL index)
│   ├── recipe.js
│   └── user.js
├── routes/
│   ├── recipe.js
│   └── user.js
├── public/
│   └── images/               # uploaded recipe images (created automatically)
├── swagger.js                # OpenAPI spec
├── index.js                  # app entry point
└── .env
```

## Data models

**User**

| Field      | Type   | Notes            |
| ---------- | ------ | ---------------- |
| `email`    | String | Required, unique |
| `password` | String | Hashed (bcrypt)  |

**Recipe**

| Field          | Type            | Notes               |
| -------------- | --------------- | ------------------- |
| `title`        | String          | Required            |
| `ingredients`  | Array           | Required            |
| `instructions` | String          | Required            |
| `time`         | String          | Optional            |
| `coverImage`   | String          | Image file name     |
| `createdBy`    | ObjectId (User) | Owner of the recipe |

**BlacklistedToken**

| Field       | Type   | Notes                                              |
| ----------- | ------ | -------------------------------------------------- |
| `token`     | String | Required, unique                                   |
| `expiresAt` | Date   | MongoDB deletes the entry automatically after this |

## Error responses

Errors are returned as JSON, usually in this shape:

```json
{ "error": "Recipe not found" }
```

| Status | Meaning                                            |
| ------ | -------------------------------------------------- |
| 400    | Invalid input, bad id, missing fields or bad image |
| 401    | Missing, invalid, expired or logged-out token      |
| 403    | You are trying to change someone else's recipe     |
| 404    | Recipe or user not found                           |
| 500    | Server error                                       |

## Troubleshooting

- **Server exits with "Failed to connect to database"**: check your MongoDB is running and the connection string in `.env` is correct.
- **Frontend cannot reach the API**: make sure `PORT=8000` and the server is running (locally), or that the frontend `API` URL points to the live base URL.
- **First request on the live server is slow**: the server may be waking up after being idle. Wait a few seconds and try again.
- **Images do not show**: check that `public/images` exists and the server is started from the project root (images are saved relative to the current working directory).
- **401 after logout**: this is expected. The old token is blacklisted, so log in again.

## Author

Made with love by **Payal Yadav**.
