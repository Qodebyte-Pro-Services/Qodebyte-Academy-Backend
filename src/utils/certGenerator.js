const PDFDocument = require("pdfkit");
const path = require("path");
const { uploadToCloudinary } = require("./cloudinaryUtil");

const generateCertificatePDF = async (studentName, courseTitle) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: "A4", 
        layout: "landscape",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(buffers);
        const uploaded = await uploadToCloudinary(pdfBuffer, `${sanitizeFilename(studentName)}_certificate.pdf`);
        resolve(uploaded.secure_url);
      });

     
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill("#f8fafc");
      
     
      doc.lineWidth(2)
         .strokeColor("#3b82f6")
         .roundedRect(40, 40, doc.page.width - 80, doc.page.height - 80, 10)
         .stroke();
      
      
      doc.fillColor("#1e40af")
         .fontSize(36)
         .font("Helvetica-Bold")
         .text("Qodebyte Academy", { 
           align: "center", 
           y: 60 
         });
      
      doc.fillColor("#64748b")
         .fontSize(14)
         .font("Helvetica")
         .text("Empowering Developers, Shaping Futures", { 
           align: "center", 
           y: 100 
         });

     
      doc.moveTo(100, 120)
         .lineTo(doc.page.width - 100, 120)
         .lineWidth(1)
         .strokeColor("#cbd5e1")
         .stroke();

     
      doc.fillColor("#1e293b")
         .fontSize(48)
         .font("Helvetica-Bold")
         .text("Certificate of Completion", { 
           align: "center", 
           y: 160 
         });

     
      doc.fillColor("#3b82f6")
         .fontSize(24)
         .text("✧", { align: "center", y: 220 });

      
      doc.fillColor("#475569")
         .fontSize(22)
         .font("Helvetica")
         .text("This is to certify that", { 
           align: "center", 
           y: 260 
         });

    
      doc.fillColor("#1e40af")
         .fontSize(36)
         .font("Helvetica-Bold")
         .text(studentName, { 
           align: "center", 
           y: 310 
         });

     
      doc.fillColor("#475569")
         .fontSize(22)
         .font("Helvetica")
         .text("has successfully completed the course", { 
           align: "center", 
           y: 370 
         });

      // Course title with emphasis
      doc.fillColor("#0f766e")
         .fontSize(28)
         .font("Helvetica-Bold")
         .text(courseTitle, { 
           align: "center", 
           y: 410 
         });

      // Decorative element
      doc.fillColor("#3b82f6")
         .fontSize(24)
         .text("✦", { align: "center", y: 450 });

      // Date section
      doc.fillColor("#64748b")
         .fontSize(16)
         .font("Helvetica-Oblique")
         .text(`Date of Completion: ${new Date().toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         })}`, { 
           align: "center", 
           y: 490 
         });

     
      doc.moveDown(4);
      
     
      const signatureY = 530;
      const signatureWidth = (doc.page.width - 120) / 2;
      
     
      doc.fillColor("#334155")
         .fontSize(14)
         .font("Helvetica")
         .text("________________________", 100, signatureY);
      
      doc.fillColor("#64748b")
         .fontSize(12)
         .text("Director / Academic Head", 100, signatureY + 25);
      
      doc.fillColor("#475569")
         .fontSize(10)
         .text("Qodebyte Academy", 100, signatureY + 45);

      
      doc.fillColor("#334155")
         .fontSize(14)
         .text("________________________", doc.page.width - 100 - signatureWidth, signatureY);
      
      doc.fillColor("#64748b")
         .fontSize(12)
         .text("Course Instructor", doc.page.width - 100 - signatureWidth, signatureY + 25);
      
      doc.fillColor("#475569")
         .fontSize(10)
         .text("Qodebyte Academy", doc.page.width - 100 - signatureWidth, signatureY + 45);

    
      doc.fillColor("#94a3b8")
         .fontSize(10)
         .font("Helvetica-Oblique")
         .text(`Certificate ID: ${generateCertificateId()}`, { 
           align: "center", 
           y: doc.page.height - 80 
         });

     
      doc.fillColor("#cbd5e1")
         .fontSize(10)
         .text("This certificate is issued digitally and can be verified at qodebyte.academy/verify", { 
           align: "center", 
           y: doc.page.height - 40 
         });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

const generateCertificateId = () => {
  const date = new Date();
  const timestamp = date.getTime().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `QB-${timestamp}-${random}`.toUpperCase();
};

module.exports = generateCertificatePDF;