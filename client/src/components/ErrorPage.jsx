import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HomeIcon, ArrowLeftIcon } from "lucide-react";

export const UnauthorizedPage = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="container px-4 mx-auto">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-red-600 mb-3">401</h1>
            <p className="text-2xl font-semibold text-gray-800 mb-2">
              Access Denied
            </p>
            <p className="text-gray-600">
              Sorry, you don&lsquo;t have permission to access this page. Please
              contact your administrator for assistance.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link to="/login">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
            <Button asChild>
              <Link to="/">
                <HomeIcon className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="container px-4 mx-auto">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-primary mb-3">404</h1>
            <p className="text-2xl font-semibold text-gray-800 mb-2">
              Page Not Found
            </p>
            <p className="text-gray-600">
              Sorry, the page you are looking for doesn&lsquo;t exist or has
              been moved.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild>
              <Link to="/">
                <HomeIcon className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
