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
    await workbook.xlsx.readFile(EXCEL_FILE); // If exists, do nothing
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
    console.log('✅ contacts.xlsx file created.');
  }
}
createExcelIfNotExists();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info.techscaleup@gmail.com', // Replace with your email
    pass: 'ajmy wudm wqxe cheg'         // Use App Password, not Gmail password
  }
});

// API Health Check Route
app.get('/', (req, res) => {
  res.send('✅ TechScaleUps Email API is running!');
});

// Contact Form Submission Route
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

    // Prepare email
    const mailOptions = {
      from: `"${name}" <info.techscaleup@gmail.com>`,
      to: 'info.techscaleup@gmail.com',
      subject: `New Contact Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    };

    // Send Email
    await transporter.sendMail(mailOptions);

    // Respond
    res.status(200).json({ success: true, message: 'Form submitted and email sent successfully.' });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
