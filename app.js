//Relative Positions of code in this file is important
const express = require("express");
const app = express();

//Setup body parser
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");

const connectDatabase = require("./config/database");
const errorMiddleware = require("./middlewares/errors");
const ErrorHandler = require("./utils/errorHandler");

//Setting up config.env file variables
dotenv.config({ path: "./config/config.env" });

//Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err.message}`);
  console.log("Shutting down due to uncaught exception.");
  process.exit(1);
});

//Connecting to database
connectDatabase();

// Setup body parser
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

// Setup security headers
app.use(helmet());

// // Creating own middleware
// const middleware = (req, res, next) => {
//   console.log("Hello from middleware");

//   //Setting up user variable globally
//   req.user = "Jaid Monwar";
//   req.requestMethod = req.method;
//   next();
// };

// app.use(middleware);

//Set cookie parser
app.use(cookieParser());

// Handle file uploads
app.use(fileUpload());

// Sanitize data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xssClean());

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: ["positions"],
  })
);

// Rate Limiting
const limitter = rateLimit({
  //100 req per 10min
  windowMs: 10 * 60 * 1000,
  max: 100,
});

// setup CORS - Accessible by Other domains
app.use(cors());

app.use(limitter);

//Importing all routes
const jobs = require("./routes/jobs");
const auth = require("./routes/auth");
const user = require("./routes/user");

app.use("/api/v1", jobs);
app.use("/api/v1", auth);
app.use("/api/v1", user);

//Handle Unhandled Routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});

//Middleware to handle errors
app.use(errorMiddleware);

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(
    `Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode.`
  );
});

//Handling Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to Unhandled promise rejection.");
  server.close(() => {
    process.exit(1);
  });
});
