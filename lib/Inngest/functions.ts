import { inngest } from "@/lib/Inngest/client";
import { sendWelcomeEmail } from "../nodemailer";

export const sendSignUpEmail = inngest.createFunction(
    {
        id: "sign-up-email",
        triggers: {
            event: "app/user.created",
        },
    },
    async ({ event, step }) => {
        await step.run("send-welcome-email", async () => {
            const introText =
                "Welcome to MarketLens! Explore stocks, follow your favourite companies, and stay informed about the market. Start by searching for a company to view its stock details.";

            const {data: {email, name}} = event;
            return await sendWelcomeEmail({ email, name, intro: introText});
        });


        return { success: true, message: 'Welcome email sent successfully' }
    }
);
