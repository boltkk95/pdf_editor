const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;

const tokenSecret = process.env.TOKEN_SECRET || 'default_secret_key';

const app = express();
const PORT = process.env.PORT || 5000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    console.log(authHeader)
    const token = authHeader.split(' ')[1]; // Bearer <token>
    console.log(token)
    jwt.verify(token, tokenSecret, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token is not valid' });
      }
      req.user = decoded; // Attach decoded payload to request object
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing' });
  }
};

const upload = multer({ storage });

// Middleware for parsing JSON requests
app.use(express.json());

// Middleware for parsing URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

app.use(cors());


// Dummy database for users
const users = [];

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ username }, tokenSecret);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No files were uploaded.');
    }
    const pdfPath = path.join(__dirname, 'uploads', req.file.filename);
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    res.json({ totalPages: pdfDoc.getPageCount() });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).send('Error processing PDF');
  }
});

// Endpoint for downloading uploaded PDF files
app.post('/download/:filename', verifyToken, async (req, res) => {
  try {
    const pdfPath = path.join(__dirname, 'uploads', req.params.filename);
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get page numbers to remove from request body
    const pagesToRemove = req.body.pagesToRemove || [];
    for (const pageNum of pagesToRemove) {
      pdfDoc.removePage(pageNum - 1); // Page numbers start from 1, but array index starts from 0
    }

    // Generate filename for modified PDF
    const filename = req.params.filename.replace(/.pdf$/, '') + "_modified.pdf";
    const filePath = path.join(__dirname, 'uploads', filename);

    // Save modified PDF to file
    await fs.writeFile(filePath, await pdfDoc.save());

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Send modified PDF to client
    const pdfRespBytes = await fs.readFile(filePath);
    res.send(pdfRespBytes);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ error: 'Error downloading PDF' });
  }
});


app.post('/movePage', verifyToken, async (req, res) => {
  const { sourceIndex, targetIndex, pdfFile } = req.body;

  try {
    const pdfPath = path.join(__dirname, 'uploads', pdfFile);
    const existingPdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();

    

    console.log(pages.length)

    if (
      sourceIndex >= 1 && sourceIndex <= pages.length &&
      targetIndex >= 1 && targetIndex <= pages.length
    ) {
      const page1 = pdfDoc.getPages()[(sourceIndex-1)];
      const page2 = pdfDoc.getPages()[(targetIndex-1)];

      // pdfDoc.removePage(sourceIndex);
      // pdfDoc.removePage(targetIndex > sourceIndex ? targetIndex - 1 : targetIndex);

      pdfDoc.insertPage((sourceIndex-1), page2);
      pdfDoc.insertPage((targetIndex-1), page1);
      

      console.log(12)

      const filename = pdfFile.replace(/.pdf$/, '') + "_rearranged.pdf";
      const filePath = path.join(__dirname, 'uploads', filename);
  
      await fs.writeFile(filePath, await pdfDoc.save());

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/pdf');
  
      // Send modified PDF to client
      console.log(filePath)
      const pdfRespBytes = await fs.readFile(filePath);
      res.send(pdfRespBytes);
    } else {
      res.status(400).json({ error: 'Invalid source or target index' });
    }
  } catch (error) {
    console.error('Error moving page:', error);
    res.status(500).json({ error: 'Internal server error11' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
