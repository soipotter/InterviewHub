import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { LoginForm } from '../features/auth/components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <AppShell header={<Header />} footer={<Footer />}>
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12 px-4">
        <LoginForm />
      </div>
    </AppShell>
  );
};

export default LoginPage;
