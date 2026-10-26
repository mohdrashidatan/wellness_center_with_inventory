import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { singpassService, singpassMessage } from "@/services/singpassService";

// Landing page after Singpass. The server has already validated the ID token;
// it sends a single-use hand-off code in the URL fragment, swapped here for the app JWT.
const SingpassCompletePage = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; the code is single-use.
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname); // drop the code from the address bar

    const code = params.get("code");
    if (!code) {
      setError(singpassMessage(params.get("error")));
      return;
    }

    singpassService
      .exchange(code)
      .then((result) => {
        toast.success("Login successful!");
        loginWithToken(result.data.token);
      })
      .catch((err) => setError(singpassMessage(err.response?.data?.code)));
  }, [loginWithToken]);

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <Card className='w-full max-w-md bg-white/30 backdrop-blur-lg shadow-xl border border-white/20 rounded-2xl'>
        <CardHeader>
          <CardTitle className='text-xl font-bold text-center'>Login with Singpass</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-center'>
          {error ? (
            <>
              <p className='text-sm text-red-700'>{error}</p>
              <Button className='w-full bg-purple-950 rounded-3xl' onClick={() => navigate("/login", { replace: true })}>
                Back to login
              </Button>
            </>
          ) : (
            <p className='flex items-center justify-center text-sm'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Completing login…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SingpassCompletePage;
