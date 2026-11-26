export function notFound(req, res) { res.status(404).json({ success: false, error: { message: `Route ${req.method} ${req.path} not found.` } }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status ?? (err.type === 'entity.too.large' ? 413 : 500);
  const message = status >= 500 && process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : (err.message || 'An unexpected server error occurred.');
  res.status(status).json({ success: false, error: { message } });
}
