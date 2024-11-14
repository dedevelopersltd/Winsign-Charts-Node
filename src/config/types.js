const Joi = require("joi");
// Schemas
const userSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  customerId: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  phone: Joi.string().optional().allow(""),
});

// Validator for IssueCategory model

// Validators
const userValidator = (data) => {
  return userSchema.validate(data);
};

//exports
module.exports = {
  userValidator,
};
