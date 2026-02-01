import { Groq } from 'groq-sdk';
import { ExpressError } from '../utils/expressError.js';
import prisma from '../prismaClient.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateEmailTemplate = async (req, res) => {
    const { prompt, eventName, attributes } = req.body;

    if (!prompt) {
        throw new ExpressError("Prompt is required", 400);
    }

    const systemPrompt = `
You are an expert email template designer. Your task is to generate a responsive HTML email template based on the user's request.
The template will be used for an event named "${eventName}".
You MUST use INLINE CSS for all styling to ensure compatibility with email clients.
You strictly create ONLY the HTML code. Do NOT output markdown ticks (like \`\`\`html). Output raw HTML string.

You must include standard placeholders where appropriate, from this list of available participant attributes:
${attributes.map(a => `{{${a}}}`).join(', ')}

Common placeholders to always consider:
{{name}} - Participant Name
{{qrCode}} - The QR Code Image URL (use inside an <img> tag src)
{{token}} - The manual entry code
{{eventName}} - The name of the event

Design Guidelines:
- Modern, clean, and professional aesthetic.
- Use a centered container with a max-width (e.g., 600px).
- Use soft colors and clear typography (sans-serif).
- Make the QR code prominent if it's a ticket or entry pass.
- BOLD key details like Token and Time.
`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate an email template for: ${prompt}` }
            ],
            model: "openai/gpt-oss-120b", // Or recommended Groq model
            // model: "llama3-70b-8192", // Fallback if oss model not found
            temperature: 0.7,
            max_tokens: 4096,
        });

        const generatedHtml = completion.choices[0]?.message?.content || "";
        // Clean markdown code blocks if any seeped through
        const cleanHtml = generatedHtml.replace(/^```html/, '').replace(/```$/, '').trim();

        res.json({ html: cleanHtml });
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new ExpressError("Failed to generate template", 500);
    }
};

// --- Draft Management ---

export const saveEmailDraft = async (req, res) => {
    const { eventId } = req.params;
    const { name, subject, template } = req.body;

    if (!name || !template) throw new ExpressError("Name and Template are required", 400);

    const draft = await prisma.emailDraft.create({
        data: {
            eventId,
            name,
            subject,
            template
        }
    });

    res.json(draft);
};

export const getEmailDrafts = async (req, res) => {
    const { eventId } = req.params;
    const drafts = await prisma.emailDraft.findMany({
        where: { eventId },
        orderBy: { updatedAt: 'desc' }
    });
    res.json(drafts);
};

export const deleteEmailDraft = async (req, res) => {
    const { draftId } = req.params;
    await prisma.emailDraft.delete({ where: { id: draftId } });
    res.json({ message: "Draft deleted" });
};
