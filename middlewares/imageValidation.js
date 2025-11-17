const Joi = require("joi");

const imageSchema = Joi.object({
  menuItemId: Joi.number().integer().min(1).required().messages({
    "number.base": "Menu Item ID must be a number",
    "number.integer": "Menu Item ID must be an integer",
    "number.min": "Menu Item ID must be at least 1",
    "any.required": "Menu Item ID is required",
  }),
  imageUrl: Joi.string().uri().max(255).required().messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be valid",
    "string.max": "Image URL cannot exceed 255 characters",
    "any.required": "Image URL is required",
  }),
});

function validateImageUpload(req, res, next) {
  const { error } = imageSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMsg = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ error: errorMsg });
  }
  next();
}

module.exports = { validateImageUpload };
