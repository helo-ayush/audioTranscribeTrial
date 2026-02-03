require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const cors = require('cors');
app.use(cors());
const port = process.env.PORT || 3000;

// 1. Ensure 'uploads' directory exists (Best Practice)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Configure Multer (Handles the incoming audio file)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/trial', upload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    try {
        if (!req.file) return res.status(400).json({ error: "No audio file." });

        // 1. STT: Groq Whisper
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));
        formData.append('model', 'whisper-large-v3');

        const groqResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });

        const transcription = groqResponse.data.text;

        // 2. Intent Extraction: Gemini Flash
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            generationConfig: { responseMimeType: "application/json" },
            systemInstruction: `You are a CRM Voice Assistant. 
            Extract the action, date, and subject from Hinglish text. 
            Return ONLY pure JSON. Today is Tuesday, Feb 3, 2026.`
        });

        const prompt = `Convert this text to JSON: "${transcription}"`;
        const result = await model.generateContent(prompt);
        // With responseMimeType: "application/json", we can parse directly
        const intent = JSON.parse(result.response.text());

        const latency = Date.now() - startTime;

        // 3. Final Response
        res.json({
            status: "success",
            latency_ms: latency,
            transcription: transcription,
            intent: intent
        });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Trial Task Failed", details: error.message });
    } finally {
        // Cleanup: Ensure file is deleted even if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});