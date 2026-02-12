import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff, PersonStanding, User } from "lucide-react";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      console.log(formData);
      await authService.singup(formData);
      toast.success("Signup successful!");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>Welcome back</CardTitle>
          <CardDescription className='text-center'>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-1 space-x-2'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input id='email' name='email' type='email' placeholder='Enter your email' value={formData.email} onChange={handleChange} className={`pl-10 ${error && "border-red-500 focus:ring-red-500"}`} disabled={loading} />
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 space-x-2'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Password</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input id='password' name='password' type={showPassword ? "text" : "password"} placeholder='Enter your password' value={formData.password} onChange={handleChange} className='pl-10 pr-10' disabled={loading} />
                  <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600' disabled={loading}>
                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>Password Confirms</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input id='passwordConfirm' name='passwordConfirm' type={showPassword ? "text" : "password"} placeholder='Enter your password' value={formData.passwordConfirm} onChange={handleChange} className='pl-10 pr-10' disabled={loading} />
                  <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600' disabled={loading}>
                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
              </div>
            </div>

            <Button type='submit' className='w-full' disabled={loading} onClick={handleSubmit}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </div>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Allready have an account? <button className='text-blue-600 hover:text-blue-800 font-medium'>Log in</button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
