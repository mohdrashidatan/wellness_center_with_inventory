const { SingpassError } = require("../services/singpassService");

const TXN_COOKIE = "pwg_sp_txn";
const COOKIE_PATH = "/api/auth/singpass";

// Singpass error responses carry error / error_description; log them for diagnosis.
const describeError = (err) =>
  [err.message, err.error, err.error_description, err.cause?.error, err.cause?.error_description]
    .filter(Boolean)
    .join(" | ");

const createSingpassController = (service, cfg) => {
  // SameSite=Lax so the cookie survives the top-level redirect back from Singpass.
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: cfg.cookieSecure,
    path: COOKIE_PATH,
  };

  const sendError = (res, err) => {
    if (err instanceof SingpassError) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    console.error("[singpass]", err);
    return res.status(500).json({ success: false, message: "Singpass request failed" });
  };

  const beginRedirect = (res, { txnToken, redirectUrl }) => {
    res.cookie(TXN_COOKIE, txnToken, { ...cookieOptions, maxAge: cfg.txnTtlSeconds * 1000 });
    res.redirect(302, redirectUrl);
  };

  const startLogin = async (req, res) => {
    try {
      beginRedirect(res, await service.startLogin({ ip: req.ip }));
    } catch (err) {
      console.error("[singpass] could not start login:", describeError(err));
      res.redirect(302, `${cfg.frontendUrl}/auth/singpass/complete#error=provider_error`);
    }
  };

  const startLink = async (req, res) => {
    try {
      const ticket = typeof req.query.ticket === "string" ? req.query.ticket : "";
      beginRedirect(res, await service.startLink({ ticket, ip: req.ip }));
    } catch (err) {
      const code = err instanceof SingpassError ? err.code : "provider_error";
      if (!(err instanceof SingpassError)) console.error("[singpass] could not start link:", describeError(err));
      res.redirect(302, `${cfg.frontendUrl}/profile#singpass=error-${code}`);
    }
  };

  const callback = async (req, res) => {
    const txnToken = req.cookies?.[TXN_COOKIE];
    res.clearCookie(TXN_COOKIE, cookieOptions);
    try {
      const params = new URLSearchParams(req.originalUrl.split("?")[1] || "");
      res.redirect(302, await service.handleCallback({ txnToken, params, ip: req.ip }));
    } catch (err) {
      console.error("[singpass] callback failed:", err.message);
      res.redirect(302, `${cfg.frontendUrl}/auth/singpass/complete#error=failed`);
    }
  };

  const jwks = (req, res) => {
    res.set("Cache-Control", "public, max-age=300");
    res.json(cfg.publicJwks);
  };

  const exchange = async (req, res) => {
    try {
      const code = typeof req.body?.code === "string" ? req.body.code : "";
      const result = await service.exchangeHandoff({ code, ip: req.ip });
      // Same response shape as POST /api/auth/login
      res.status(200).json({ success: true, message: "Login successful", data: result });
    } catch (err) {
      sendError(res, err);
    }
  };

  const linkStatus = async (req, res) => {
    try {
      res.json({ success: true, data: await service.getLinkStatus(req.user.userId) });
    } catch (err) {
      sendError(res, err);
    }
  };

  const linkTicket = async (req, res) => {
    try {
      const ticket = await service.createLinkTicket({ useracid: req.user.userId, ip: req.ip });
      const url = new URL(`${COOKIE_PATH}/link/start`, cfg.apiOrigin);
      url.searchParams.set("ticket", ticket);
      res.json({ success: true, data: { url: url.href, expiresIn: cfg.linkTicketTtlSeconds } });
    } catch (err) {
      sendError(res, err);
    }
  };

  const unlink = async (req, res) => {
    try {
      await service.unlinkOwn({ useracid: req.user.userId, ip: req.ip });
      res.json({ success: true, message: "Singpass account unlinked" });
    } catch (err) {
      sendError(res, err);
    }
  };

  const listLinks = async (req, res) => {
    try {
      res.json({ success: true, data: await service.listLinks({ adminId: req.user.userId }) });
    } catch (err) {
      sendError(res, err);
    }
  };

  const revokeLink = async (req, res) => {
    try {
      const identityId = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(identityId)) throw new SingpassError("invalid_request", 400, "Invalid link id");
      await service.revokeLink({ adminId: req.user.userId, identityId, ip: req.ip });
      res.json({ success: true, message: "Singpass link revoked" });
    } catch (err) {
      sendError(res, err);
    }
  };

  return { startLogin, startLink, callback, jwks, exchange, linkStatus, linkTicket, unlink, listLinks, revokeLink };
};

module.exports = { createSingpassController, TXN_COOKIE };
