import { useState } from 'react';
import { Button, Card, ErrorText, Field, Input } from '../components/ui';
import { usePreviewAuth } from '../lib/previewAuth';

export function StaffLogin() {
  const preview = usePreviewAuth();
  const [identifier, setIdentifier] = useState('owner@happytails.local');
  const [password, setPassword] = useState('OwnerPass!123');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Preview mode: accept the demo owner or admin credentials locally.
    if (identifier === 'admin@furfairy.in' && password === 'ChangeMe!123') {
      preview.signInAs('PLATFORM_ADMIN', '/admin');
      return;
    }
    if (password.length >= 6) {
      // Shop admins land on Settings first to configure their shop.
      preview.signInAs('EMPLOYEE', '/shop/settings');
      return;
    }
    setError('In preview mode, use the demo credentials shown below.');
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Shop / Admin sign in</h1>
      <p className="mb-5 text-sm text-slate-500">For shop owners, employees and platform admins.</p>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email or username">
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
      <div className="mt-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-500">
        <p className="font-medium text-slate-600">Demo credentials</p>
        <p>Shop owner: owner@happytails.local / OwnerPass!123</p>
        <p>Platform admin: admin@furfairy.in / ChangeMe!123</p>
      </div>
    </div>
  );
}
