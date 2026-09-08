const { OAuth2Client } = require("google-auth-library");

/**
 * Cryptographically verifies a Google ID token from Google Identity Services (GIS)
 * and extracts the verified profile details.
 *
 * Validates:
 * - Cryptographic signature via Google's public keys
 * - Audience (matches process.env.GOOGLE_CLIENT_ID)
 * - Issuer (accounts.google.com or https://accounts.google.com)
 * - Expiration (exp)
 * - email_verified === true
 *
 * @param {string} idToken - The credential JWT string returned by GIS
 * @returns {Promise<{ sub: string, email: string, name: string, picture: string }>}
 */
const verifyGoogleIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== "string") {
    const error = new Error("Google credential token is required");
    error.statusCode = 400;
    throw error;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error = new Error("Google authentication is not configured on the server");
    error.statusCode = 500;
    throw error;
  }

  const client = new OAuth2Client(clientId);

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });
  } catch (err) {
    const error = new Error(`Google token verification failed: ${err.message}`);
    error.statusCode = 401;
    throw error;
  }

  const payload = ticket.getPayload();
  if (!payload) {
    const error = new Error("Invalid Google token payload");
    error.statusCode = 401;
    throw error;
  }

  // Validate issuer
  const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
  if (!validIssuers.includes(payload.iss)) {
    const error = new Error(`Untrusted token issuer: ${payload.iss}`);
    error.statusCode = 401;
    throw error;
  }

  // Validate subject
  if (!payload.sub || typeof payload.sub !== "string") {
    const error = new Error("Google token is missing valid subject identifier (sub)");
    error.statusCode = 401;
    throw error;
  }

  // Validate email presence and verification
  if (!payload.email || typeof payload.email !== "string") {
    const error = new Error("Google profile is missing an email address");
    error.statusCode = 400;
    throw error;
  }

  if (payload.email_verified !== true && payload.email_verified !== "true") {
    const error = new Error("Google account email is not verified");
    error.statusCode = 403;
    throw error;
  }

  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: (payload.name || payload.given_name || "Traveler").trim(),
    picture: payload.picture || ""
  };
};

module.exports = {
  verifyGoogleIdToken
};
