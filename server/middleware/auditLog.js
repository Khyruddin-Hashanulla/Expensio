/**
 * Attaches audit context to the request. Services use req.audit metadata
 * when recording entries so IP / user agent are captured consistently.
 */
export function auditContext(req, res, next) {
  req.auditMeta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'] || null,
    requestId: req.headers['x-request-id'] || null,
  };
  next();
}
