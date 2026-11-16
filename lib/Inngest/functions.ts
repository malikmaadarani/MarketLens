import { inngest } from "@/lib/Inngest/client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/Inngest/prompts";
import { sendWelcomeEmail } from "../nodemailer";

export const sendSignUpEmail = inngest.createFunction(
    {
        id: "sign-up-email",
        triggers: {
            event: "app/user.created",
        },
    },
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
            "{{userProfile}}",
            userProfile
        );

        const response = await step.ai.infer("generate-welcome-intro", {
            model: step.ai.models.openai({
                model: "gpt-5",
                apiKey: process.env.OPEN_AI_API_KEY,
            }),
            body: {
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            },
        });

        
        await step.run("send-welcome-email", async () => {
            const introText =
                response.choices[0]?.message.content?.trim() ||
                "Thank you for joining MarketLens! We are thrilled to have you on board and look forward to helping you achieve your investment goals.";

            const {data: {email, name}} = event;
            return await sendWelcomeEmail({ email, name, intro: introText});
        });


        return { success: true, message: 'Welcome email sent successfully' }
    }
);