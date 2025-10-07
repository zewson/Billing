import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/request', upload.fields([
    { name: 'appIcon', maxCount: 1 },
    { name: 'splashScreen', maxCount: 1 },
]), async (req, res) => {
    const config = req.body;
    const files = req.files;
    console.log('Build Request Received:', { config, files });
    try {
        await axios.post(
            `https://api.github.com/repos/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/dispatches`,
            {
                event_type: 'build-app-trigger',
                client_payload: { config }
            },
            { headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } }
        );
        res.status(202).json({ message: 'Build request successfully triggered.' });
    } catch (error) {
        res.status(500).json({ message: "Failed to trigger the build process." });
    }
});

export default router;