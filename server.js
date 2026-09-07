const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// ضع مفتاح Google Gemini API الخاص بك هنا
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

app.post('/api/analyze', async (req, res) => {
    try {
        const { profileUrl } = req.body;
        
        if (!profileUrl) {
            return res.status(400).json({ error: 'يرجى تقديم رابط الحساب' });
        }

        // 1. هنا يتم سحب الصور من الحساب عبر خدمة Scraping (مثل Apify أو RapidAPI)
        // سنفترض هنا تمرير روابط الصور التي تم سحبها:
        const sampleImageUrls = [
            "https://example.com/photo1.jpg",
            "https://example.com/photo2.jpg"
        ];

        // 2. إرسال الصور أو وصفها لموديل الذكاء الاصطناعي Gemini للتحليل
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
        قم بتحليل هذا الحساب على إنستغرام بناءً على المحتوى والفرز المتاح.
        أرجع لي النتيجة بأسلوب دقيق بصيغة JSON تحتوي على الحقول التالية فقط:
        {
          "likes": "قائمة بالأشياء والاهتمامات والمشروبات والألوان التي يحبها والفريق الرياضي المفضل",
          "travels": "الأماكن والدول أو الطبيعة التي يتردد عليها",
          "dislikes": "الأشياء التي يكرهها أو يتجنبها بناء على نمط حياته",
          "advice": "نصائح مركزة وعملية لكسب مودته والبدء بالحديث معه"
        }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // تحويل النص إلى JSON وإرساله للواجهة
        const analysisData = JSON.parse(responseText);
        res.json({ success: true, data: analysisData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'حدث خطأ أثناء تحليل البيانات' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
