const Joi = require("joi");

const menuItemSchema = Joi.object({
  stallId: Joi.number().integer().min(1).required().messages({
    "number.base": "Stall ID must be a number",
    "number.integer": "Stall ID must be an integer",
    "number.min": "Stall ID must be at least 1",
    "any.required": "Stall ID is required",
  }),
  name: Joi.string().min(1).max(100).required().messages({
    "string.base": "Menu item name must be a string",
    "string.empty": "Menu item name cannot be empty",
    "string.min": "Menu item name must have at least 1 character",
    "string.max": "Menu item name cannot exceed 100 characters",
    "any.required": "Menu item name is required",
  }),
  description: Joi.string().max(255).allow("").messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 255 characters",
  }),
  price: Joi.number().precision(2).min(0).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
    "any.required": "Price is required",
  }),
  url: Joi.string().max(255).allow("").messages({
    "string.base": "Main image URL must be a string",
    "string.max": "Image URL cannot exceed 255 characters",
  }),
  category: Joi.string().min(1).max(50).required().messages({
    "string.base": "Category must be a string",
    "string.empty": "Category cannot be empty",
    "string.min": "Category must have at least 1 character",
    "string.max": "Category cannot exceed 50 characters",
    "any.required": "Category is required",
  }),
});

function validateMenuItem(req, res, next) {
  const { error } = menuItemSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMsg = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ error: errorMsg });
  }
  next();
}

module.exports = { validateMenuItem };
