import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Gamepad2, Eye, EyeOff, Loader2, Mail, Phone, Chrome } from 'lucide-react';

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
  
  const { login, loginWithPhone, googleAuth, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const result = await sendOTP(phone);
      setOtpSent(true);
      setMockOtp(result.mock_otp); // For testing - remove in production
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyOTP(phone, otp);
      if (result.is_new_user) {
        navigate('/signup', { state: { phone } });
      } else {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Mock Google OAuth
    setLoading(true);
    try {
      const mockGoogleData = {
        token: 'mock-google-token',
        email: 'googleuser@gmail.com',
        name: 'Google User',
        avatar: null
      };
      await googleAuth(mockGoogleData);
      toast.success('Welcome!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black gradient-text">GGS</span>
          </Link>
          <h1 className="text-2xl font-black">Welcome Back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full mb-4 h-12"
            onClick={handleGoogleLogin}
            disabled={loading}
            data-testid="google-login-btn"
          >
            <Chrome className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Auth Method Tabs */}
          <Tabs value={authMethod} onValueChange={setAuthMethod}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Phone className="w-4 h-4" />
                Mobile
              </TabsTrigger>
            </TabsList>

            {/* Email Login */}
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="login-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="login-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700"
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
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="flex gap-2">
                      <Input
                        value="+91"
                        disabled
                        className="w-16"
                      />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        data-testid="login-phone"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    onClick={handleSendOTP}
                    disabled={loading || phone.length < 10}
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
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      data-testid="login-otp"
                    />
                    {mockOtp && (
                      <p className="text-xs text-amber-500">Mock OTP for testing: {mockOtp}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-700"
                    disabled={loading || otp.length < 6}
                    data-testid="verify-otp-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                  >
                    Change Number
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">New to Game Gear Swap? </span>
            <Link to="/signup" className="text-violet-500 hover:underline font-medium">
              Create an account
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Demo Credentials:</p>
            <div className="space-y-1 text-xs">
              <p><span className="text-muted-foreground">Admin:</span> admin@ggs.com / admin123</p>
              <p><span className="text-muted-foreground">User:</span> user@ggs.com / user123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
