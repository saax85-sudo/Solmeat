const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/analyze', async (req, res) => {
    try {
        const { images } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: "يرجى رفع صورة واحدة على الأقل." });
        }

        // تحضير الصور للذكاء الاصطناعي
        const imageParts = images.map(img => {
            const matches = img.match(/^data:(.+);base64,(.+)$/);
            if (!matches) return null;
            return {
                inlineData: {
                    mimeType: matches[1],
                    data: matches[2]
                }
            };
        }).filter(item => item !== null);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `أنت خبير في تحليل الشخصيات ولغة الجسد والانطباعات العامة. 
أمامك صور سكرين شوت لصفحة حساب إنستغرام أو منشوراته.
قم بقراءة النصوص والألوان وأسلوب المحتوى والمظهر العام، ثم اكتب تقريراً مشوقاً ولطيفاً باللغة العربية يوضح:
1. الانطباع الأول ونوع الشخصية.
2. الاهتمامات المتوقعة وطريقة التفكير.
3. أفضل طريقة للتواصل أو التقرب من صاحب هذا الحساب.
اصغ التقرير بأسلوب جميل ومقسم إلى نقاط واضحة.`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();

        res.json({ analysis: responseText });

    } catch (error) {
        console.error("Error during analysis:", error);
        res.status(500).json({ 
            error: "حدث خطأ أثناء تحليل الصور. تأكد من إعداد GEMINI_API_KEY في Vercel." 
        });
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
