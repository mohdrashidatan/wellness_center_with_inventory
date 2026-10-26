// TEST ONLY. In-memory equivalent of src/models/singpassModel.js with the same
// single-use and uniqueness semantics, so tests never touch a database.
const createMemoryStore = () => {
  const txns = new Map();
  const codes = new Map();
  const identities = [];
  const auditLog = [];
  let nextId = 1;

  const claim = (row, now) => {
    if (!row) return { status: "not_found" };
    if (row.consumedAt) return { status: "consumed" };
    row.consumedAt = now;
    if (row.expiresAt <= now) return { status: "expired" };
    return { status: "ok" };
  };

  const publicIdentity = (i) => i && { ...i, active: i.isActive === 1 };

  return {
    auditLog,
    identities,

    async createTxn({ txnHash, purpose, useracid, state, nonce, codeVerifier, dpopKeyPair, expiresAt }) {
      txns.set(txnHash, {
        id: nextId++,
        purpose,
        useracid: useracid ?? null,
        state,
        nonce,
        codeVerifier,
        dpopKeyPair: structuredClone(dpopKeyPair),
        expiresAt,
        consumedAt: null,
      });
    },

    async consumeTxn(txnHash, now) {
      const row = txns.get(txnHash);
      const { status } = claim(row, now);
      if (!row) return { status };
      const txn = { id: row.id, purpose: row.purpose, useracid: row.useracid };
      if (status === "ok") Object.assign(txn, { state: row.state, nonce: row.nonce, codeVerifier: row.codeVerifier, dpopKeyPair: row.dpopKeyPair });
      if (status === "ok" || status === "expired") {
        row.state = row.nonce = row.codeVerifier = row.dpopKeyPair = null;
      }
      return { status, txn };
    },

    async createOneTimeCode({ codeHash, purpose, useracid, identityId, expiresAt }) {
      codes.set(codeHash, { id: nextId++, purpose, useracid, identityId: identityId ?? null, expiresAt, consumedAt: null });
    },

    async consumeOneTimeCode(codeHash, purpose, now) {
      const row = codes.get(codeHash);
      if (!row || row.purpose !== purpose) return { status: "not_found" };
      const { status } = claim(row, now);
      return { status, code: { id: row.id, useracid: row.useracid, identityId: row.identityId } };
    },

    async purgeExpired() {},

    async findActiveIdentityBySubject(issuer, subject) {
      return publicIdentity(identities.find((i) => i.issuer === issuer && i.subject === subject && i.isActive === 1));
    },

    async findActiveIdentityForUser(useracid) {
      return publicIdentity(identities.find((i) => i.useracid === useracid && i.isActive === 1));
    },

    async findIdentityById(id) {
      return publicIdentity(identities.find((i) => i.id === id));
    },

    async insertIdentity({ useracid, issuer, subject, linkedBy, now }) {
      const clash = identities.some(
        (i) => i.isActive === 1 && ((i.issuer === issuer && i.subject === subject) || i.useracid === useracid)
      );
      if (clash) return { status: "conflict" };
      const id = nextId++;
      identities.push({ id, useracid, issuer, subject, isActive: 1, linkedAt: now, linkedBy, lastLoginAt: null });
      return { status: "ok", id };
    },

    async touchIdentityLogin(id, now) {
      const i = identities.find((x) => x.id === id);
      if (i) i.lastLoginAt = now;
    },

    async revokeIdentity(id, revokedBy, now) {
      const i = identities.find((x) => x.id === id && x.isActive === 1);
      if (!i) return false;
      Object.assign(i, { isActive: null, revokedAt: now, revokedBy });
      return true;
    },

    async listActiveIdentities() {
      return identities.filter((i) => i.isActive === 1).map(publicIdentity);
    },

    async audit(entry) {
      auditLog.push(entry);
    },
  };
};

module.exports = { createMemoryStore };
