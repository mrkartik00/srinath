const PDFDocument = require('pdfkit');
const storageService = require('./storageService');

const generatePrescriptionPdf = async (prescription, doctorProfile) => {
  const key = `prescriptions/${prescription._id}.pdf`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('error', reject);
    doc.on('end', () => {
      storageService
        .save(key, Buffer.concat(chunks), 'application/pdf')
        .then((storedKey) => resolve(storedKey))
        .catch(reject);
    });

    const doctorName = prescription.doctorId?.name || 'Doctor';
    const patientName = prescription.patientId?.userId?.name || 'Patient';
    const qualification = doctorProfile?.qualification || '';
    const license = doctorProfile?.licenseNumber || '';
    const specialization = doctorProfile?.specialization || '';

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Janki Care Platform', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666').text('Digital Prescription', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#255946');
    doc.moveDown(0.8);

    // Doctor info
    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text(`Dr. ${doctorName}`);
    if (qualification) doc.fontSize(10).font('Helvetica').text(qualification);
    if (specialization) doc.fontSize(10).text(`Specialization: ${specialization}`);
    if (license) doc.fontSize(9).fillColor('#666').text(`License: ${license}`);
    doc.moveDown();

    // Patient info box
    doc.fillColor('#000').fontSize(11).font('Helvetica-Bold').text('Patient Details');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${patientName}`);
    doc.text(`Date: ${new Date(prescription.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    if (prescription.diagnosis) doc.text(`Diagnosis: ${prescription.diagnosis}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ddd');
    doc.moveDown();

    // Rx symbol
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#255946').text('℞', { continued: false });
    doc.moveDown(0.3);

    // Medicines
    doc.fillColor('#000');
    for (let i = 0; i < prescription.medicines.length; i++) {
      const med = prescription.medicines[i];
      doc.fontSize(12).font('Helvetica-Bold').text(`${i + 1}. ${med.name} — ${med.dosage}`);
      doc.fontSize(10).font('Helvetica').fillColor('#333');
      doc.text(`   ${med.frequency.replace(/_/g, ' ')} | ${med.duration} days | Timings: ${med.timings.join(', ')}`);
      if (med.instructions) doc.fillColor('#666').text(`   ↳ ${med.instructions}`);
      doc.fillColor('#000').moveDown(0.5);
    }

    // Notes
    if (prescription.notes) {
      doc.moveDown();
      doc.fontSize(10).font('Helvetica-Bold').text('Doctor\'s Notes:');
      doc.font('Helvetica').text(prescription.notes);
    }

    // Footer — fixed at bottom
    const footerY = doc.page.height - 80;
    doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#255946');
    doc.fontSize(9).font('Helvetica').fillColor('#666');
    doc.text(`Dr. ${doctorName}`, 50, footerY + 10);
    if (license) doc.text(`Reg. No: ${license}`, 50, footerY + 22);
    doc.text('Janki Care Platform', 400, footerY + 10, { align: 'right' });
    doc.text('Digitally Generated — No signature required', 400, footerY + 22, { align: 'right' });
    doc.fontSize(8).text(`Prescription ID: ${prescription._id}`, 50, footerY + 38);

    doc.end();
  });
};

module.exports = { generatePrescriptionPdf };
