'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import InputField from '@/components/Forms/InputField';

type SignInFormData = {
    email: string;
    password: string;
};

const SignIn = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        // Connect your authentication service here.
        // Avoid logging passwords.
    };

    return (
        <>
            <h1 className="form-title">Welcome Back</h1>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
            >
                <InputField
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: 'Email is required',
                        pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Enter a valid email address',
                        },
                    }}
                />

                <InputField
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    register={register}
                    error={errors.password}
                    validation={{
                        required: 'Password is required',
                    }}
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="yellow-btn mt-5 w-full"
                >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>

                <p className="text-center text-sm text-gray-400">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/sign-up"
                        className="text-yellow-400 hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </form>
        </>
    );
};

export default SignIn;