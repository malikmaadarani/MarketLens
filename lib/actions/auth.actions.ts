'use server';

import {auth} from "@/lib/betterAuth/auth"; 
import { inngest } from "@/lib/Inngest/client";
import { headers } from "next/headers";

export const signUpWithEmail = async ({email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry}: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({
            body: { email, password, name: fullName },
        });

        try {
            await inngest.send({
                name: 'app/user.created',
                data: {
                    email,
                    name: fullName,
                    country,
                    investmentGoals,
                    riskTolerance,
                    preferredIndustry,
                },
            });
        } catch (eventError) {
            console.error(
                'Account created, but user.created event failed:',
                eventError
            );
        }

        return { success: true, data: response };
    } catch (e) {
        console.error('Sign up failed:', e);

        const code = (
            e as { body?: { code?: string } }
        )?.body?.code;

        return {
            success: false,
            error:
                code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
                    ? 'An account with this email already exists. Please sign in.'
                    : 'Failed to create your account. Please try again.',
        };
    }
}

export const signInWithEmail = async ({email, password}: SignInFormData) => {
    try{
        const response = await auth.api.signInEmail ({ body: {email, password}})

        return {success: true, data: response}
    }

    catch(e){
        console.log('Sign in failed', e)
        return {success: false, error: 'Sign in failed'}
    }
}


export const signOut = async () => {
    try{
        await auth.api.signOut({headers: await headers()});
    }

    catch (e) {
        console.log('Sign out failed', e)
        return {success: false, error: 'Sign outy failed'}
    }
}

