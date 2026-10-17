import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (error) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4 border border-purple-950'>
      <Card className='w-full max-w-md bg-white/30 backdrop-blur-lg shadow-xl border border-white/20 rounded-2xl'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>Forgot password</CardTitle>
          <CardDescription className='text-center text-black'>
            {submitted ? "Check your inbox for a reset link" : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className='flex flex-col items-center gap-4 py-4 text-center'>
              <CheckCircle2 className='h-10 w-10 text-green-600' />
              <p className='text-sm text-gray-700'>
                If an account exists for <span className='font-medium'>{email}</span>, a password reset link has been sent. The link expires shortly, so use it soon.
              </p>
              <Button variant='link' onClick={() => navigate("/login")}>
                Back to login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='Enter your email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='pl-10'
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type='submit' className='w-full bg-purple-950 rounded-3xl p-5' disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>

              <div className='text-center'>
                <button type='button' className='text-sm text-blue-600 hover:text-blue-800 font-medium' onClick={() => navigate("/login")}>
                  Back to login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
