import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from './useAuth';
import { validateConfirmPassword, validateEmail, validatePassword } from '../utils/authValidation';

export function useRegister() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setRequiresConfirmation(false);

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPassword);

    setEmailError(emailErr);
    setPasswordError(passErr);
    setConfirmPasswordError(confirmErr);

    if (emailErr || passErr || confirmErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.register({ email, password });
      if (result.requiresEmailConfirmation) {
        setRequiresConfirmation(true);
      } else {
        await register({ email, password });
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
