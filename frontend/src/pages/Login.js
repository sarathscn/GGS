import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Mail, Phone, Chrome, RotateCcw } from 'lucide-react';

export default function Login() {
  const [authMethod, setAuthMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef(null);

  const { login, loginWithPhone, sendOTP, verifyOTP, googleAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCooldownTimer = (seconds = 30) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCooldown(seconds);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (loading || cooldown > 0) return;

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${cleanPhone}`;
      const res = await sendOTP(formattedPhone);
      setOtpSent(true);
      setMockOtp(res?.mock_otp || '');
      toast.success('OTP sent to your mobile number');
      startCooldownTimer(30);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0 || loading) return;
    await handleSendOTP();
  };

  const handleVerifyOTP = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (loading) return;

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error('Invalid mobile number. Please check and try again.');
      return;
    }

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${cleanPhone}`;
      const res = await verifyOTP(formattedPhone, cleanOtp);

      if (res && res.is_new_user) {
        toast.error('No account found with this mobile number. Please create an account.');
        navigate('/signup', { state: { phone: cleanPhone } });
        return;
      }

      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const mockGoogleData = {
        email: `google_user_${Date.now()}@gmail.com`,
        name: 'Google User',
        google_id: `google_${Date.now()}`
      };
      await googleAuth(mockGoogleData);
      toast.success('Logged in with Google!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  // Aliases for compatibility
  const handleSendOtp = handleSendOTP;
  const handleVerifyOtp = handleVerifyOTP;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex justify-center mb-3.5">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/25 flex items-center justify-center p-2 shadow-lg shadow-violet-500/5">
              <img src="/ggs-logo.jpg" alt="GGS Game Gear Swap" className="w-full h-full object-contain rounded-xl" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full mb-4 h-12 rounded-xl font-semibold border-border hover:bg-muted/80"
            onClick={handleGoogleLogin}
            disabled={loading}
            data-testid="google-login-btn"
          >
            <Chrome className="w-5 h-5 mr-2 text-violet-500" />
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-semibold">Or continue with</span>
            </div>
          </div>

          {/* Auth Method Tabs */}
          <Tabs value={authMethod} onValueChange={(val) => { setAuthMethod(val); setOtpSent(false); setOtp(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11 p-1 bg-muted/60 rounded-xl">
              <TabsTrigger value="email" className="gap-2 rounded-lg font-semibold text-xs sm:text-sm">
                <Mail className="w-4 h-4" />
                Email & Password
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2 rounded-lg font-semibold text-xs sm:text-sm">
                <Phone className="w-4 h-4" />
                Mobile OTP
              </TabsTrigger>
            </TabsList>

            {/* Email Login */}
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl"
                    data-testid="login-email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl pr-10"
                      data-testid="login-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-600/20"
                  disabled={loading}
                  data-testid="login-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Phone OTP Login */}
            <TabsContent value="phone">
              {!otpSent ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Number</Label>
                    <div className="flex gap-2">
                      <Input
                        value="+91"
                        disabled
                        className="w-16 h-11 rounded-xl text-center font-mono font-bold bg-muted"
                      />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        className="h-11 rounded-xl font-mono text-base tracking-wider"
                        data-testid="login-phone"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">We will send a 6-digit one-time password to this number.</p>
                  </div>

                  <Button
                    type="button"
                    className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-600/20"
                    onClick={handleSendOTP}
                    disabled={loading || phone.replace(/\D/g, '').length < 10}
                    data-testid="send-otp-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="otp" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Enter 6-Digit OTP</Label>
                      <span className="text-xs font-mono text-violet-500 font-semibold">+91 {phone}</span>
                    </div>

                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      className="h-12 rounded-xl text-center font-mono text-xl tracking-[0.3em] font-bold"
                      data-testid="login-otp"
                    />

                    {mockOtp && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
                        Mock OTP for testing: <strong className="font-mono">{mockOtp}</strong>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-600/20"
                    disabled={loading || otp.trim().length < 6}
                    data-testid="verify-otp-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying OTP...
                      </>
                    ) : (
                      'Verify & Sign In'
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                      onClick={() => { setOtpSent(false); setOtp(''); setMockOtp(''); }}
                    >
                      Change Number
                    </button>

                    <button
                      type="button"
                      disabled={cooldown > 0 || loading}
                      onClick={handleResendOTP}
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        cooldown > 0 
                          ? 'text-muted-foreground cursor-not-allowed' 
                          : 'text-violet-500 hover:text-violet-600 hover:underline'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">New to Game Gear Swap? </span>
            <Link to="/signup" className="text-violet-500 hover:underline font-bold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
