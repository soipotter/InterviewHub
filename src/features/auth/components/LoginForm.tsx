import React from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
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

export const LoginForm: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    emailError,
    passwordError,
    serverError,
    isSubmitting,
    handleSubmit,
  } = useLogin();

  return (
    <Card className="border-slate-800 bg-slate-950/90 shadow-2xl max-w-md w-full mx-auto">
      <CardHeader className="text-left border-b border-slate-800/80 pb-4">
        <CardTitle className="text-xl text-white">Log In to InterviewHub</CardTitle>
        <CardDescription className="text-xs text-slate-400 mt-1">
          Access your personalized dashboard, saved bookmarks, and category progress history.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="flex flex-col gap-4 pt-6 text-left">
          {serverError && (
            <Alert variant="error" title="Authentication Error">
              {serverError}
            </Alert>
          )}

          {/* Email Address Input */}
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

          {/* Password Input with Show/Hide Toggle */}
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError || undefined}
            required
            autoComplete="current-password"
            rightAddon={
              <button
                type="button"
                onClick={toggleShowPassword}
                className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                aria-label={showPassword ? 'Hide password text' : 'Show password text'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
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
            Log In
          </Button>

          <p className="text-xs text-slate-400 text-center">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:underline font-semibold">
              Create an Account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
