// utils/verifyGoogleToken.js
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async ( token ) => {
   try {
    const ticket = await client.verifyIdToken({
        idToken : token,
        audience : process.env.GOOGLE_CLIENT_ID,

    });

    const payload = ticket.getPayload();

    return {
        email : payload.email,
        name : payload.name,
        profile_image : payload.picture,
        googleId : payload.sub,
        email_verified : payload.email_verified,

    };
} catch ( error ) {
    console.log("Failed to verify Google Token", error);
    throw new Error("Invalid google token");
}
};


module.exports = verifyGoogleToken;