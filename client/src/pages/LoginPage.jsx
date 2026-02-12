import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      await login(formData);
      toast.success("Login successful!");
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
    <div className='min-h-screen flex items-center justify-center  px-4 border border-purple-950'>
      <Card className='w-full max-w-md bg-white/30 backdrop-blur-lg shadow-xl border border-white/20 rounded-2xl'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>Login</CardTitle>
          <CardDescription className='text-center text-black'>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <input id='email' name='email' type='email' placeholder='Enter your email' value={formData.email} onChange={handleChange} className='pl-10 py-3 rounded-xl bg-white/70 border-none focus:ring-2 focus:ring-purple-500 w-full placeholder-gray-500 outline-none' disabled={loading} />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <input
                  id='password'
                  name='password'
                  type={showPassword ? "text" : "password"}
                  placeholder='Enter your password'
                  value={formData.password}
                  onChange={handleChange}
                  className='pl-10 py-3 rounded-xl bg-white/70 border-none focus:ring-2 focus:ring-purple-500 w-full placeholder-gray-500 outline-none'
                  disabled={loading}
                />
                <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600' disabled={loading}>
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
              <div className='mt-4 text-right'>
                <Button className='text-sm text-blue-600 hover:text-blue-800' variant='link'>
                  Forgot your password?
                </Button>
              </div>
            </div>

            <Button type='submit' className='w-full bg-purple-950 rounded-3xl p-5' disabled={loading} onClick={handleSubmit}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                "LOGIN"
              )}
            </Button>
          </div>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Don&lsquo;t have an account?{" "}
              <button className='text-blue-600 hover:text-blue-800 font-medium' onClick={() => navigate("/signup")}>
                Sign up
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
