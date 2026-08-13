import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axiosClient.js';
import { useAuthStore } from '../store/authStore.js';

export default function Login() {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data.data.accessToken, data.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/otp/request', { phone });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { phone, code: otp });
      setSession(data.data.accessToken, data.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="login-logo">HERO<span>ERP</span></div>
        <div className="login-sub">Supply, logistics & delivery lifecycle management</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className={`btn ${mode === 'password' ? '' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setMode('password')}>
            Email & Password
          </button>
          <button className={`btn ${mode === 'otp' ? '' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setMode('otp')}>
            Phone OTP
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-row">
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
            <div className="form-row">
              <label>Phone number</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} required />
            </div>
            {otpSent && (
              <div className="form-row">
                <label>Enter OTP</label>
                <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
              </div>
            )}
            {error && <div className="error-text">{error}</div>}
            <button className="btn" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Please wait…' : otpSent ? 'Verify OTP' : 'Send OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
