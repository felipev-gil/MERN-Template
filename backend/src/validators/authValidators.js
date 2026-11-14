const { body, validationResult } = require('express-validator');
const email = () => body('email').isString().bail().trim().isLength({ max: 254 }).isEmail().withMessage('Enter a valid email.').bail().toLowerCase();
const password = () => body('password').isString().bail().isLength({ min: 8 }).withMessage('Use at least 8 characters.').bail().custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password must fit within 72 UTF-8 bytes.');
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Check the highlighted fields.', errors: errors.array({ onlyFirstError: true }).map(error => ({ field: error.path, message: error.msg })) });
  next();
}
const registerRules = [body('name').isString().bail().trim().isLength({ min: 2, max: 80 }).withMessage('Name must contain 2–80 characters.'), email(), password(), validate];
const loginRules = [email(), password(), validate];
module.exports = { registerRules, loginRules };

