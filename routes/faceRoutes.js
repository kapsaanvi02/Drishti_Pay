const express = require('express');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();

// Storage for Face Images
const storage = multer.diskStorage({
    destination: './faces',  
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Fake Database for Face Registration
const FACE_DB_FILE = 'registered_faces.json';
if (!fs.existsSync(FACE_DB_FILE)) fs.writeFileSync(FACE_DB_FILE, JSON.stringify([]));

const loadRegisteredFaces = () => {
    try {
        const data = fs.readFileSync(FACE_DB_FILE, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading face database:", error);
        return [];
    }
};

const saveFace = (faceData) => {
    let faces = loadRegisteredFaces();
    faces.push(faceData);
    fs.writeFileSync(FACE_DB_FILE, JSON.stringify(faces, null, 2));
};

// ** Register Face API **
router.post('/register_face', upload.single('face_image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No face image uploaded" });
    }

    const newFace = {
        userId: "user" + Date.now(),
        faceId: req.file.filename,
        filePath: req.file.path
    };

    saveFace(newFace);
    console.log(`✅ Face Registered: ${newFace.userId}, Image: ${newFace.filePath}`);

    res.json({ success: true, message: "Face registered successfully!", userId: newFace.userId });
});

module.exports = router;
