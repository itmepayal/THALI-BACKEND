const PORT = process.env.PORT || 8000;

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Thali Recipes API",
    version: "1.0.0",
    description:
      "Backend API for the Thali recipe app. Log in first, click **Authorize** and paste the token to try the protected routes.",
  },
  servers: [{ url: `http://localhost:${PORT}`, description: "Local server" }],
  tags: [
    { name: "Auth", description: "Sign up, log in and log out" },
    { name: "User", description: "User details" },
    { name: "Recipes", description: "Browse and manage recipes" },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste only the token. Do not type the word Bearer.",
      },
    },

    schemas: {
      Credentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "you@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "secret123",
          },
        },
      },
      UserPublic: {
        type: "object",
        properties: {
          _id: { type: "string", example: "665f1c2e9b1e8a0012a3b4c5" },
          email: { type: "string", example: "you@example.com" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          user: { $ref: "#/components/schemas/UserPublic" },
        },
      },
      Recipe: {
        type: "object",
        properties: {
          _id: { type: "string", example: "665f1d0a9b1e8a0012a3b4d6" },
          title: { type: "string", example: "Paneer butter masala" },
          ingredients: {
            type: "array",
            items: { type: "string" },
            example: ["250 g paneer", "3 tomatoes", "2 tbsp butter"],
          },
          instructions: {
            type: "string",
            example: "Blend the tomatoes.\nSimmer with butter for 10 minutes.",
          },
          time: { type: "string", example: "35 min" },
          coverImage: {
            type: "string",
            description: "File name. Image is served at /images/{coverImage}",
            example: "1730000000000-123456.jpg",
          },
          createdBy: { type: "string", example: "665f1c2e9b1e8a0012a3b4c5" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RecipeForm: {
        type: "object",
        properties: {
          title: { type: "string", example: "Paneer butter masala" },
          ingredients: {
            type: "array",
            items: { type: "string" },
            description: "Send one field per ingredient",
          },
          instructions: {
            type: "string",
            example: "Blend the tomatoes.\nSimmer with butter for 10 minutes.",
          },
          time: { type: "string", example: "35 min" },
          file: {
            type: "string",
            format: "binary",
            description: "Cover image (JPG, PNG, WebP or GIF, max 5 MB)",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Something went wrong" },
        },
      },
    },

    responses: {
      Unauthorized: {
        description: "Token is missing, invalid, expired or logged out",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      BadRequest: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Forbidden: {
        description: "You are not the owner of this recipe",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },

    parameters: {
      IdParam: {
        name: "id",
        in: "path",
        required: true,
        description: "MongoDB ObjectId",
        schema: { type: "string", example: "665f1d0a9b1e8a0012a3b4d6" },
      },
    },
  },

  paths: {
    /* ---------------- Auth ---------------- */

    "/signUp": {
      post: {
        tags: ["Auth"],
        summary: "Create a new account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          200: {
            description: "Account created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },

    "/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },

    "/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out (the token is blacklisted)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Logged out successfully",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: {
            description: "Logout failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    /* ---------------- User ---------------- */

    "/user/{id}": {
      get: {
        tags: ["User"],
        summary: "Get a user's email by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "User found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "you@example.com" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    /* ---------------- Recipes ---------------- */

    "/recipe": {
      get: {
        tags: ["Recipes"],
        summary: "Get all recipes (newest first)",
        responses: {
          200: {
            description: "List of recipes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Recipe" },
                },
              },
            },
          },
          500: {
            description: "Could not load recipes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },

      post: {
        tags: ["Recipes"],
        summary: "Add a recipe",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                allOf: [{ $ref: "#/components/schemas/RecipeForm" }],
                required: ["title", "ingredients", "instructions"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Recipe created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Recipe" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    "/recipe/{id}": {
      get: {
        tags: ["Recipes"],
        summary: "Get one recipe",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "Recipe found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Recipe" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },

      put: {
        tags: ["Recipes"],
        summary: "Edit your own recipe",
        description:
          "Only the fields you send are changed. Sending a new `file` replaces the old image.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/RecipeForm" },
            },
          },
        },
        responses: {
          200: {
            description: "Recipe updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Recipe" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },

      delete: {
        tags: ["Recipes"],
        summary: "Delete your own recipe",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          200: {
            description: "Recipe deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
