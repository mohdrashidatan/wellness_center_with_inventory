// Singpass Login routes, mounted at /api/auth/singpass only when SINGPASS_ENABLED=true.
const express = require("express");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { rateLimit } = require("../middlewares/rateLimit");
const { createSingpassController } = require("../controllers/singpassController");

const createSingpassRouter = (service, cfg, { rateLimitMax = 30 } = {}) => {
  const c = createSingpassController(service, cfg);
  const router = express.Router();

  const limit = { windowMs: 15 * 60 * 1000, max: rateLimitMax, message: "Too many Singpass login attempts" };
  const startLimiter = rateLimit(limit);
  const exchangeLimiter = rateLimit(limit);

  router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  // Browser navigations (full-page redirects to and from Singpass)
  router.get("/login", startLimiter, c.startLogin);
  router.get("/link/start", startLimiter, c.startLink);
  router.get("/callback", c.callback);

  // Public JWKS (public keys only), for portals configured with a JWKS URL
  router.get("/jwks", c.jwks);

  // XHR from the React app
  router.post("/exchange", exchangeLimiter, c.exchange);
  router.get("/link", authenticateToken, c.linkStatus);
  router.post("/link/ticket", authenticateToken, c.linkTicket);
  router.delete("/link", authenticateToken, c.unlink);
  router.get("/links", authenticateToken, c.listLinks);
  router.post("/links/:id/revoke", authenticateToken, c.revokeLink);

  return router;
};

// Production wiring: MySQL store, real users table, shared password-login token builder.
const createDefaultSingpassRouter = (cfg) => {
  const { createSingpassService } = require("../services/singpassService");
  const { createSingpassOidcClient } = require("../services/singpassOidcClient");
  const store = require("../models/singpassModel");
  const users = require("../models/usersModel");
  const { buildAuthToken } = require("../services/authService");

  const service = createSingpassService({
    cfg,
    oidc: createSingpassOidcClient(cfg),
    store,
    users,
    buildAuthToken,
  });
  return createSingpassRouter(service, cfg);
};

module.exports = { createSingpassRouter, createDefaultSingpassRouter };
