import { openAPI } from "better-auth/plugins";
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: 'MarketLens',
  ai: {ChatGPT: {apiKey: process.env.OPEN_AI_API_KEY}}
})
