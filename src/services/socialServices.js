
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    console.log("✅ Google token verified:", {
      email: payload.email,
      aud: payload.aud,
      iss: payload.iss,
    });

    return {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error("❌ Google token verification failed:", err.message);
    console.error("Error details:", err);
    return null;
  }
}

module.exports = { verifyGoogleToken };