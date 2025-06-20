const vision = require("@google-cloud/vision");
const path = require("path");

const client = new vision.ImageAnnotatorClient({
    keyFilename : path.join(__dirname,"../config/google-vision-key.json"),
});

const extractTextFromImage = async ( imageUrl ) => {
    try {
        const [ result ] = await client.textDetection(imageUrl);
        const detections = result.textAnnotations;
        const extractedText = detections[0] ?.description || "";
        return extractedText.trim();
    } catch ( error ) {
        console.error("Google vision OCR Error :", error.message);
        throw new Error("Failed to extract text from image using Google vision");

    }
};

module.exports = extractTextFromImage;