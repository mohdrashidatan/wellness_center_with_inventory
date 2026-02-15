import { ProtectedRoute } from "../components/ProtectedRoute";

const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
    <h2 className="text-2xl font-semibold mb-2">{title}</h2>
    <p className="text-sm">This module is under construction.</p>
  </div>
);
import { NotFoundPage } from "../components/ErrorPage";
import { PublicRoute } from "@/components/PublicRoute";
import LoginPage from "@/pages/LoginPage";
import Layout from "@/components/Layout";
import StepsLayout from "@/components/StepsLayout";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import CustomerRegistrationForm from "@/components/form/customerDataForm/CustomerRegistrationForm";
import CustomerConsentForm from "@/components/form/consentForm/CustomerConsentForm";
import CustomerEvaluationForm from "@/components/form/CustomerEvaluationForm";
import CustomerFeedbackForm from "@/components/form/CustomerFeedbackForm";
import CustomerReview from "@/components/form/CustomerReviewForm";
import CustomerSteps from "@/pages/CustomerSteps";
import SignupPage from "@/pages/SignupPage";
import TherapistDashboard from "@/pages/TherapistDashboard";
import Logout from "@/pages/auth/Logout";
import TherapistEvaluation from "@/pages/TherapistEvaluation";
import EvaluationForm from "@/components/form/evaluationForm/EvaluationForm";
import Pos from "@/pages/Pos";

import Checkout from "@/components/pos/Checkout";
import PrintReceipt from "@/components/receiptPdf/PrintReceipt";
import TransactionHistory from "@/pages/TransactionHistory";
import UomPage from "@/pages/UomPage";
import UsersPage from "@/pages/UsersPage";
import GrnReceivedPage from "@/pages/GrnReceivedPage";
import GrnEntryPage from "@/pages/GrnEntryPage";
import ProductsSetupPage from "@/pages/ProductsSetupPage";
import ProductDetailPage from "@/pages/ProductDetailPage";

const privateRoutes = {
  path: "/",
  element: (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: <DashboardPage /> },
    { path: "dashboard", element: <CustomerSteps /> },
    { path: "profile", element: <ProfilePage /> },
  ],
};

const stepsRoutes = {
  path: "/steps",
  element: (
    <ProtectedRoute allowedRoles={["Customer"]}>
      <StepsLayout />
    </ProtectedRoute>
  ),
  children: [
    { path: "personal-data", element: <CustomerRegistrationForm /> },
    { path: "consent", element: <CustomerConsentForm /> },
    { path: "evaluation", element: <CustomerEvaluationForm /> },
    { path: "review", element: <CustomerReview /> },
    { path: "feedback", element: <CustomerFeedbackForm /> },
    { path: "evaluation/dev", element: <EvaluationForm /> },
  ],
};

const therapistRoutes = {
  path: "/therapist",
  element: (
    <ProtectedRoute allowedRoles={["Therapist"]}>
      <Layout />
    </ProtectedRoute>
  ),
  children: [
    { path: "", element: <TherapistDashboard /> },
    { path: "pos/:id", element: <Pos /> },
    { path: "pos/", element: <Pos /> },
    { path: "checkout", element: <Checkout /> },
    { path: "printreceipt", element: <PrintReceipt /> },
    { path: "evaluation/:id", element: <TherapistEvaluation /> },
    { path: "transaction/:id", element: <TransactionHistory /> },
    { path: "setup/uom", element: <UomPage /> },
    { path: "setup/users", element: <UsersPage /> },
    { path: "setup/products", element: <ProductsSetupPage /> },
    { path: "setup/products/:id", element: <ProductDetailPage /> },
    { path: "sales/reports", element: <ComingSoon title="Sales Reports" /> },
    { path: "stocks/reports", element: <ComingSoon title="Stock Reports" /> },
    { path: "stocks/incoming", element: <GrnReceivedPage /> },
    { path: "stocks/grn/new", element: <GrnEntryPage /> },
    { path: "stocks/transfers", element: <ComingSoon title="Stock Transfers" /> },
    { path: "stocks/adjustments", element: <ComingSoon title="Stock Adjustments" /> },
  ],
};

const publicRoutes = [
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <PublicRoute>
        <SignupPage />
      </PublicRoute>
    ),
  },
  {
    path: "/logout",
    element: (
      <PublicRoute>
        <Logout />
      </PublicRoute>
    ),
  },
];

export const routes = [...publicRoutes, privateRoutes, stepsRoutes, therapistRoutes, { path: "*", element: <NotFoundPage /> }];
