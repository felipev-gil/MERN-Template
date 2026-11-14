function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000 || error.code === '23505') return res.status(409).json({ message: 'An account with this email already exists.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
  // Avoid logging request bodies, credentials, database URLs, or raw database errors.
  console.error('Unexpected API error:', error.name || 'Error');
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
module.exports = { errorHandler };

