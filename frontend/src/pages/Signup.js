import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Gamepad2, Eye, EyeOff, Loader2, Mail, Phone, Chrome } from 'lucide-react';

export default function Signup() {
  const location = useLocation();
  const [authMethod, setAuthMethod] = useState(location.state?.phone ? 'phone' : 'email');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(location.state?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(!!location.state?.phone);
  const [otp, setOtp] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  
  const { signup, googleAuth, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    setLoading(true);
    try {
      await signup({
        email,
        password,
        name,
        username,
        auth_type: 'email'
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
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
      setMockOtp(result.mock_otp);
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignup = async (e) => {
    e.preventDefault();

    if (!name) {
      toast.error('Please enter your name');
      return;
    }

    if (!username) {
      toast.error('Please enter a username');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    setLoading(true);
    try {
      // First verify OTP if not already verified
      if (otp) {
        const result = await verifyOTP(phone, otp);
        if (result.is_new_user) {
          // Create account
          await signup({
            phone: `+91${phone}`,
            name,
            username,
            auth_type: 'phone'
          });
        }
      } else {
        await signup({
          phone: `+91${phone}`,
          name,
          username,
          auth_type: 'phone'
        });
      }
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!agreeTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }
    setLoading(true);
    try {
      const mockGoogleData = {
        token: 'mock-google-token',
        email: `user${Date.now()}@gmail.com`,
        name: 'Google User',
        username: `user${Date.now()}`.substring(0, 15),
        avatar: null
      };
      await googleAuth(mockGoogleData);
      toast.success('Account created!');
      navigate('/');
    } catch (error) {
      toast.error('Google signup failed');
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
          <h1 className="text-2xl font-black">Create Account</h1>
          <p className="text-muted-foreground mt-1">Join the gaming community</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
          {/* Google Signup */}
          <Button
            variant="outline"
            className="w-full mb-4 h-12"
            onClick={handleGoogleSignup}
            disabled={loading || !agreeTerms}
            data-testid="google-signup-btn"
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

            {/* Email Signup */}
            <TabsContent value="email">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-testid="signup-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                    data-testid="signup-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="signup-email"
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
                      data-testid="signup-password"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    data-testid="signup-confirm-password"
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={setAgreeTerms}
                    data-testid="signup-terms"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-tight cursor-pointer"
                  >
                    I agree to GGS's{' '}
                    <Link to="/page/terms" className="text-violet-500 hover:underline">Terms and Conditions</Link>
                    {' '}and{' '}
                    <Link to="/page/privacy-policy" className="text-violet-500 hover:underline">Privacy Policy</Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={loading}
                  data-testid="signup-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Phone Signup */}
            <TabsContent value="phone">
              <form onSubmit={handlePhoneSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-name">Full Name</Label>
                  <Input
                    id="phone-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-testid="signup-phone-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-username">Username</Label>
                  <Input
                    id="phone-username"
                    type="text"
                    placeholder="johndoe123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                    data-testid="signup-phone-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-number">Mobile Number</Label>
                  <div className="flex gap-2">
                    <Input
                      value="+91"
                      disabled
                      className="w-16"
                    />
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      disabled={otpSent}
                      data-testid="signup-phone"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleSendOTP}
                    disabled={loading || phone.length < 10}
                    data-testid="signup-send-otp"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Send OTP
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="signup-otp">Enter OTP</Label>
                    <Input
                      id="signup-otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      data-testid="signup-otp-input"
                    />
                    {mockOtp && (
                      <p className="text-xs text-amber-500">Mock OTP for testing: {mockOtp}</p>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                    >
                      Change Number
                    </Button>
                  </div>
                )}

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms-phone"
                    checked={agreeTerms}
                    onCheckedChange={setAgreeTerms}
                    data-testid="signup-terms-phone"
                  />
                  <label
                    htmlFor="terms-phone"
                    className="text-sm text-muted-foreground leading-tight cursor-pointer"
                  >
                    I agree to GGS's{' '}
                    <Link to="/page/terms" className="text-violet-500 hover:underline">Terms and Conditions</Link>
                    {' '}and{' '}
                    <Link to="/page/privacy-policy" className="text-violet-500 hover:underline">Privacy Policy</Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={loading || !otpSent || otp.length < 6}
                  data-testid="signup-phone-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-violet-500 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
