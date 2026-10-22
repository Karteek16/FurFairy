import { useState } from 'react';
import { Button, Card, ErrorText, Field, Input } from '../components/ui';
import { usePreviewAuth } from '../lib/previewAuth';

export function CustomerLogin() {
  const preview = usePreviewAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+919111111111');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [error, setError] = useState('');

  function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Preview: generate a local 6-digit code and show it, mirroring sandbox OTP.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(code);
    setStep('otp');
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (otp === sentOtp) {
      preview.signInAs('CUSTOMER', '/account/pets');
    } else {
      setError('Incorrect code. Use the code shown below (preview mode).');
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Customer sign in</h1>
      <p className="mb-5 text-sm text-slate-500">Sign in with your mobile number.</p>
      <Card>
        {step === 'phone' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <Field label="Mobile number">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Button type="submit" className="w-full">
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <Field label="Enter OTP" hint={`Preview OTP: ${sentOtp}`}>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" className="w-full">
              Verify & sign in
            </Button>
            <button
              type="button"
              className="w-full text-sm text-slate-400 hover:text-slate-600"
              onClick={() => setStep('phone')}
            >
              ← Change number
            </button>
          </form>
        )}
      </Card>
      <p className="mt-4 text-center text-xs text-slate-400">
        Preview mode — OTP is generated locally, no SMS is sent.
      </p>
    </div>
  );
}
