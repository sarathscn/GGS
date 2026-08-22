import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { FIELD_LIMITS, validateFieldLength } from '../lib/fieldLimits';
import { 
  HelpCircle, 
  Send, 
  CheckCircle2, 
  Loader2, 
  ShieldAlert, 
  MessageSquare, 
  FileText, 
  CreditCard,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

const CATEGORIES = [
  { value: 'Technical issue', label: 'Technical Issue / Bug', icon: HelpCircle },
  { value: 'Payment issue', label: 'Payment & Service Charge Issue', icon: CreditCard },
  { value: 'Listing issue', label: 'Listing & Ad Publishing Issue', icon: FileText },
  { value: 'Account issue', label: 'Account, Login & Profile Issue', icon: UserCheck },
  { value: 'Verification issue', label: 'Seller Verification (KYC) Issue', icon: UserCheck },
  { value: 'Scam/fraud report', label: 'Scam / Fraud Report', icon: ShieldAlert },
  { value: 'Fake deal', label: 'Fake Deal / Misleading Pricing', icon: AlertTriangle },
  { value: 'Fake sale', label: 'Fake Sale / Non-Existent Product', icon: AlertTriangle },
  { value: 'Seller/buyer problem', label: 'Seller or Buyer Dispute', icon: MessageSquare },
  { value: 'Messaging problem', label: 'In-App Chat & Messaging Issue', icon: MessageSquare },
  { value: 'Other support request', label: 'Other Support Request', icon: HelpCircle },
];

export default function Contact() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'Other support request');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [description, setDescription] = useState('');
  const [listingId, setListingId] = useState(searchParams.get('listing_id') || '');
  const [transactionId, setTransactionId] = useState(searchParams.get('txn_id') || '');
  
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      toast.error('Please select an issue category');
      return;
    }
    const subjectCheck = validateFieldLength(subject, FIELD_LIMITS.SUPPORT_SUBJECT, true, 'Subject');
    if (!subjectCheck.valid) {
      toast.error(subjectCheck.error);
      return;
    }
    const descCheck = validateFieldLength(description, FIELD_LIMITS.SUPPORT_MESSAGE, true, 'Description');
    if (!descCheck.valid) {
      toast.error(descCheck.error);
      return;
    }
    if (!user && (!name.trim() || !email.trim())) {
      toast.error('Please provide your name and email');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: user ? user.name : name.trim(),
        email: user ? user.email : email.trim(),
        phone: user ? user.phone : phone.trim(),
        category,
        subject: subject.trim(),
        description: description.trim(),
        listing_id: listingId.trim() || null,
        transaction_id: transactionId.trim() || null
      };

      const res = await api.post('/support/submit', payload);
      setSubmittedTicket(res.data.ticket_number);
      toast.success('Your support request has been submitted.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit support request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setSubject('');
    setDescription('');
    setListingId('');
    setTransactionId('');
  };

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-500 mb-4 shadow-sm">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Contact Support & Moderation
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
            Report a problem, submit an inquiry, or report a suspicious deal. Our Kerala moderation team reviews all requests promptly.
          </p>
        </div>

        {/* Success Confirmation State */}
        {submittedTicket ? (
          <div className="bg-card border border-emerald-500/30 rounded-2xl p-6 sm:p-10 text-center shadow-xl shadow-black/5 animate-in fade-in-50 zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Request Submitted Successfully</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              Your support request has been registered with our moderation queue. We will review your ticket and notify you via email.
            </p>
            
            <div className="bg-muted/50 border border-border rounded-xl p-4 my-6 max-w-xs mx-auto">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reference Ticket ID</span>
              <p className="text-xl font-mono font-bold text-violet-500 mt-1">{submittedTicket}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto font-semibold">
                Submit Another Request
              </Button>
              <Link to="/marketplace" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 font-semibold">
                  Back to Marketplace
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Support Form */
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/5">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Issue Category *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="h-11 rounded-xl" data-testid="support-category-select">
                    <SelectValue placeholder="Select an issue category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="py-2.5">
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4 text-violet-500 shrink-0" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Details (Auto-filled or manual) */}
              {!user ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Alex John"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground">Submitting as: </span>
                    <strong className="text-foreground">{user.name}</strong> ({user.email || user.phone})
                  </div>
                  <span className="text-violet-500 font-medium">Account Linked</span>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject">Subject *</Label>
                  <span className={`text-xs ${subject.length >= FIELD_LIMITS.SUPPORT_SUBJECT ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                    {subject.length} / {FIELD_LIMITS.SUPPORT_SUBJECT}
                  </span>
                </div>
                <Input
                  id="subject"
                  placeholder="Brief summary of the issue or report"
                  value={subject}
                  maxLength={FIELD_LIMITS.SUPPORT_SUBJECT}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                  data-testid="support-subject-input"
                />
              </div>

              {/* Optional References */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="listing-id" className="text-xs text-muted-foreground">
                    Related Listing ID / URL (Optional)
                  </Label>
                  <Input
                    id="listing-id"
                    placeholder="e.g., rtx-4080-super-12345"
                    value={listingId}
                    maxLength={80}
                    onChange={(e) => setListingId(e.target.value)}
                    className="rounded-xl font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-id" className="text-xs text-muted-foreground">
                    Transaction / Payment ID (Optional)
                  </Label>
                  <Input
                    id="transaction-id"
                    placeholder="e.g., TXN-92841"
                    value={transactionId}
                    maxLength={50}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <span className={`text-xs ${description.length >= FIELD_LIMITS.SUPPORT_MESSAGE ? 'text-amber-500 font-bold' : 'text-muted-foreground'}`}>
                    {description.length} / {FIELD_LIMITS.SUPPORT_MESSAGE}
                  </span>
                </div>
                <Textarea
                  id="description"
                  placeholder="Please describe what happened in detail. If reporting a scam or fake listing, include username, dates, and communication details..."
                  value={description}
                  maxLength={FIELD_LIMITS.SUPPORT_MESSAGE}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                  className="rounded-xl resize-y"
                  data-testid="support-description-input"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold text-base rounded-xl shadow-lg shadow-violet-600/20"
                disabled={loading}
                data-testid="support-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting Support Ticket...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Support Request
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Support Safety Notice */}
        <div className="mt-8 bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 text-xs text-muted-foreground text-center leading-relaxed">
          <p>
            <strong>Security Reminder:</strong> GGS staff will never ask for your password, credit card CVV, or one-time password (OTP). Report any suspicious messages immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
