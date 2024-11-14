const dotenv = require("dotenv");
const joi = require("joi");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });
const envVarsSchema = joi
  .object()
  .keys({
    NODE_ENV: joi
      .string()
      .valid("production", "development", "test")
      .required(),
    DB_DIALECT: joi
      .string()
      .valid("mysql", "postgres", "sqlite", "mssql")
      .required(),
    DB_HOST: joi.string().required(),
    DB_NAME: joi.string().required(),
    DB_USER: joi.string().required(),
    DB_PASSWORD: joi.when("NODE_ENV", {
      is: joi.string().valid("development"),
      then: joi.string().optional().allow(""),
      otherwise: joi.string().required(),
    }),
    JWT_SECRET: joi.string().required(),
    JWT_EXPIRATION: joi.string().required(),
    PORT: joi.number().positive().required(),
    MAIL_USER: joi.string().required(),
    MAIL_PASSWORD: joi.string().required(),
    MAIL_HOST: joi.string().required(),
    SNOWFLAKE_USER: joi.string().required(),
    SNOWFLAKE_PASSWORD: joi.string().required(),
    SNOWFLAKE_ACCOUNT: joi.string().required(),
    SNOWFLAKE_WAREHOUSE: joi.string().required(),
    SNOWFLAKE_DB: joi.string().required(),
    SNOWFLAKE_ROLE: joi.string().required(),
    SNOWFLAKE_SCHEMA: joi.string().required(),
  })
  .unknown();
const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  dbDialect: envVars.DB_DIALECT,
  dbHost: envVars.DB_HOST,
  dbName: envVars.DB_NAME,
  dbUser: envVars.DB_USER,
  dbPassword: envVars.DB_PASSWORD,
  jwtSecret: envVars.JWT_SECRET,
  jwtExpirationInterval: envVars.JWT_EXPIRATION,
  cloudinaryName: envVars.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: envVars.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: envVars.CLOUDINARY_API_SECRET,
  mailUser: envVars.MAIL_USER,
  mailPassword: envVars.MAIL_PASSWORD,
  mailHost: envVars.MAIL_HOST,
  snowflakeUser: envVars.SNOWFLAKE_USER,
  snowflakePassword: envVars.SNOWFLAKE_PASSWORD,
  snowflakeAccount: envVars.SNOWFLAKE_ACCOUNT,
  snowflakeWarehouse: envVars.SNOWFLAKE_WAREHOUSE,
  snowflakeDb: envVars.SNOWFLAKE_DB,
  snowflakeRole: envVars.SNOWFLAKE_ROLE,
  snowflakeSchema: envVars.SNOWFLAKE_SCHEMA
};
