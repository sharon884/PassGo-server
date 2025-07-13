const QRCode = require('qrcode');
const streamifier = require('streamifier');
const { cloudinary } = require('./cloudinary');

async function generateQrCodeImage({ ticketId, qrData }) {
  try {
    // 1. Generate QR Code as buffer
    const qrBuffer = await QRCode.toBuffer(qrData);

    // 2. Upload buffer to Cloudinary as image
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'qrcodes',
          public_id: `qr_ticket_${ticketId}`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(qrBuffer).pipe(uploadStream);
    });

    return result.secure_url;
  } catch (err) {
    console.error("QR code generation failed:", err);
    return null;
  }
}

module.exports = generateQrCodeImage;
