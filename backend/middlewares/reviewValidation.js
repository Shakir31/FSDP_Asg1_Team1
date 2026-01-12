const Joi = require("joi");

const reviewSchema = Joi.object({
  menuItemId: Joi.number().integer().min(1).required().messages({
    "number.base": "Menu Item ID must be a number",
    "number.integer": "Menu Item ID must be an integer",
    "number.min": "Menu Item ID must be at least 1",
    "any.required": "Menu Item ID is required",
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number",
    "number.integer": "Rating must be an integer",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating cannot exceed 5",
    "any.required": "Rating is required",
  }),
  reviewText: Joi.string().min(1).max(1000).required().messages({
    "string.base": "Review text must be a string",
    "string.empty": "Review text cannot be empty",
    "string.min": "Review text must have at least 1 character",
    "string.max": "Review text cannot exceed 1000 characters",
    "any.required": "Review text is required",
  }),
  imageId: Joi.number().integer().allow(null).messages({
    "number.base": "Image ID must be a number",
    "number.integer": "Image ID must be an integer",
  }),
});

function validateReview(req, res, next) {
  const { error } = reviewSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMsg = error.details.map((detail) => detail.message).join(", ");
    return res.status(400).json({ error: errorMsg });
  }
  next();
}

module.exports = { validateReview };
