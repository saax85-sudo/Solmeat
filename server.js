const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// إعداد استقبال الصور في الذاكرة
const upload = multer({ storage: multer.memoryStorage() });

const apiKey = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/analyze', upload.array('screenshots', 3), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "يرجى رفع صورة سكرين شوت واحدة على الأقل." });
        }

        // تحويل الصور المرفوعة إلى الصيغة المطلوبة لـ Gemini
        const imageParts = req.files.map(file => ({
            inlineData: {
                data: file.buffer.toString("base64"),
                mimeType: file.mimetype
            }
        }));

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `أنت خبير في تحليل الشخصيات ولغة الجسد والانطباعات العامة من الصور.
أمامك صور سكرين شوت لصفحة حساب إنستغرام و/أو منشوراته.
قم بقراءة وتحليل النصوص، الصور، البيو، وأسلوب الصفحة، ثم اكتب تقريراً ممتعاً باللغة العربية يتضمن:
1. الانطباع الأول ونوع الشخصية (الطابع العام).
2. الاهتمامات المتوقعة وطريقة التفكير بناءً على المحتوى البصري والنصوص.
3. نقطة القوة البارزة في الحساب.
4. أفضل طريقة للتواصل أو التقرب من صاحب هذا الحساب.
اجعل الأسلوب مشوقاً، لطيفاً، ومقسم إلى نقاط واضحة.`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();

        res.json({ analysis: responseText });

    } catch (error) {
        console.error("Error during image analysis:", error);
        res.status(500).json({ 
            error: "حدث خطأ أثناء تحليل الصور. تأكد من إعداد GEMINI_API_KEY بشكل صحيح." 
        });
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
