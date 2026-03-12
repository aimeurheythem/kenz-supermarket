import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Verification failed. The link may have expired.");
      });
  }, [searchParams, verifyEmail]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        {status === "loading" && <p className="text-gray-600">Verifying your email...</p>}
        {status === "success" && (
          <>
            <h1 className="mb-4 text-2xl font-bold text-green-600">Verified!</h1>
            <p className="mb-6 text-gray-600">{message}</p>
            <Link
              to="/login"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              Sign In
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="mb-4 text-2xl font-bold text-red-600">Verification Failed</h1>
            <p className="mb-6 text-gray-600">{message}</p>
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
