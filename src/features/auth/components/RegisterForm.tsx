import React from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../hooks/useRegister';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';

export const RegisterForm: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword,
    emailError,
    passwordError,
    confirmPasswordError,
    serverError,
    requiresConfirmation,
    isSubmitting,
    handleSubmit,
  } = useRegister();

  return (
    <Card className="border-slate-800 bg-slate-950/90 shadow-2xl max-w-md w-full mx-auto">
      <CardHeader className="text-left border-b border-slate-800/80 pb-4">
        <CardTitle className="text-xl text-white">Create an Account</CardTitle>
        <CardDescription className="text-xs text-slate-400 mt-1">
          Join InterviewHub to save your practice history, track category accuracy, and bookmark key
          questions.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="flex flex-col gap-4 pt-6 text-left">
          {requiresConfirmation && (
            <Alert variant="info" title="Verification Email Sent">
              Account created! Please check your email inbox to verify your account before logging
              in.
            </Alert>
          )}

          {serverError && (
            <Alert variant="error" title="Registration Error">
              {serverError}
            </Alert>
          )}

          {/* Email Address */}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError || undefined}
            required
            autoComplete="email"
          />

          {/* Password */}
          <Input
            label="Password (min. 8 characters)"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError || undefined}
            required
            autoComplete="new-password"
            rightAddon={
              <button
                type="button"
                onClick={toggleShowPassword}
                className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPasswordError || undefined}
            required
            autoComplete="new-password"
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-slate-800/80 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full font-semibold"
          >
            Create Account
          </Button>

          <p className="text-xs text-slate-400 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
              Log In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
