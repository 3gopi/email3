const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Excel file path
const EXCEL_FILE = path.join(__dirname, 'contacts.xlsx');

// Create Excel file if it doesn't exist
async function createExcelIfNotExists() {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(EXCEL_FILE);
  } catch {
    const sheet = workbook.addWorksheet('Contacts');
    sheet.columns = [
      { header: 'Full Name', key: 'name' },
      { header: 'Phone Number', key: 'phone' },
      { header: 'Email', key: 'email' },
      { header: 'Service', key: 'service' },
      { header: 'Message', key: 'message' },
      { header: 'Date', key: 'date' }
    ];
    await workbook.xlsx.writeFile(EXCEL_FILE);
  }
}
createExcelIfNotExists();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info.techscaleup@gmail.com',
    pass: 'ajmy wudm wqxe cheg' // App password (not Gmail password)
  }
});

// Contact API Route
app.post('/contact', async (req, res) => {
  const { name, phone, email, service, message } = req.body;

  if (!name || !phone || !email || !service || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // Save to Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE);
    const sheet = workbook.getWorksheet('Contacts');
    sheet.addRow({
      name,
      phone,
      email,
      service,
      message,
      date: new Date().toLocaleString()
    });
    await workbook.xlsx.writeFile(EXCEL_FILE);

    // Email content
    const mailOptions = {
      from: `"${name}" <info.techscaleup@gmail.com>`, // You can't spoof 'from' address with Gmail
      to: 'info.techscaleup@gmail.com',
      subject: `New Contact Submission from ${name} (${email})`, // 👈 Email visible in inbox
      html: `
        <h2>Contact Form Submission</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Service:</b> ${service}</p>
        <p><b>Message:</b> ${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Form submitted and email sent.' });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
