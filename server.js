const express = require("express");
const app = express();
require("dotenv").config();

const connectDb = require("./config/connectionDb");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/", require("./routes/user"));
app.use("/recipe", require("./routes/recipe"));

const startServer = async () => {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
  }
};

startServer();
