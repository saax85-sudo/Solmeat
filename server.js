const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// جلب المفتاح من متغيرات البيئة أو استخدام مفتاح افتراضي
const apiKey = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/analyze', async (req, res) => {
    try {
        const { profileUrl } = req.body;

        if (!profileUrl) {
            return res.status(400).json({ error: "يرجى إدخال رابط الحساب." });
        }

        // استخراج اسم المستخدم من الرابط بسهولة وبدون تعقيد Regex
        let username = "المستخدم";
        try {
            const urlObj = new URL(profileUrl.startsWith('http') ? profileUrl : `https://${profileUrl}`);
            const pathSegments = urlObj.pathname.split('/').filter(p => p.length > 0);
            if (pathSegments.length > 0) {
                username = pathSegments[0];
            }
        } catch (e) {
            username = profileUrl.replace(/[^a-zA-Z0-9_.]/g, '');
        }

        // استخدام نموذج Gemini للتحليل النصي
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `أنت خبير في تحليل الشخصيات ولغة الجسد والانطباعات العامة. 
قم بكتابة تقرير تحليل شخصية لطيف وممتع ومحفز لشخص يملك حساب إنستغرام باسم (${username}).
اجعل التحليل يتضمن:
1. الانطباع الأول ونوع الشخصية.
2. الاهتمامات المتوقعة وطريقة التفكير.
3. أفضل طريقة للتقرب من هذا الشخص وكسب قلبه.
اصغ التقرير بأسلوب جذاب، باللغة العربية، وبنسق نقاط واضحة.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.json({ analysis: responseText });

    } catch (error) {
        console.error("Error during analysis:", error);
        res.status(500).json({ 
            error: "حدث خطأ أثناء معالجة الطلب. تأكد من ضبط مفتاح GEMINI_API_KEY في Vercel." 
        });
    }
});

// للتوافق مع Vercel Serverless
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
