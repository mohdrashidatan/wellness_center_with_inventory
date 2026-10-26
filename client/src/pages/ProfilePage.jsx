import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { SINGPASS_ENABLED, singpassService, singpassMessage } from "@/services/singpassService";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "—");

const SingpassLinkCard = () => {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    singpassService
      .getStatus()
      .then(setStatus)
      .catch(() => setStatus({ eligible: false, linked: false }));

  useEffect(() => {
    // Result of a link attempt, sent back by the server in the fragment.
    const result = new URLSearchParams(window.location.hash.slice(1)).get("singpass");
    if (result) {
      window.history.replaceState(null, "", window.location.pathname);
      if (result === "linked") toast.success("Singpass account linked");
      else toast.error(singpassMessage(result.replace(/^error-/, "")));
    }
    load();
  }, []);

  const startLink = async () => {
    setBusy(true);
    try {
      window.location.assign(await singpassService.requestLinkUrl());
    } catch (err) {
      toast.error(singpassMessage(err.response?.data?.code));
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (!window.confirm("Unlink Singpass from this account? You can still log in with your password.")) return;
    setBusy(true);
    try {
      await singpassService.unlink();
      toast.success("Singpass account unlinked");
      await load();
    } catch {
      toast.error("Could not unlink Singpass");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className='max-w-xl'>
      <CardHeader>
        <CardTitle>Login with Singpass</CardTitle>
        <CardDescription>
          Link your Singpass account to log in without a password. You will be asked to log in to Singpass once to confirm.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        {!status ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : !status.eligible ? (
          <p className='text-gray-600'>Singpass login is not available for this account.</p>
        ) : status.linked ? (
          <>
            <p>
              <span className='font-semibold text-green-700'>Linked</span> since {formatDate(status.linkedAt)}
            </p>
            <p className='text-gray-600'>Last Singpass login: {formatDate(status.lastLoginAt)}</p>
            <Button variant='outline' disabled={busy} onClick={unlink}>
              Unlink Singpass
            </Button>
          </>
        ) : (
          <>
            <p className='text-gray-600'>Not linked.</p>
            <Button className='bg-red-700 hover:bg-red-800' disabled={busy} onClick={startLink}>
              {busy && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Link Singpass account
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Profile</h1>
        <p className='text-sm text-gray-600'>
          {user?.email} · {user?.role}
        </p>
      </div>
      {SINGPASS_ENABLED && user?.role !== "Customer" && <SingpassLinkCard />}
    </div>
  );
};

export default ProfilePage;
