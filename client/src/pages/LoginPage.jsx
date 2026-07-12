import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Input, Label, Card, ErrorMessage } from "../components/ui.jsx";
import GoogleButton from "../components/GoogleButton.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable To Sign In. Check Your Credentials.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link
            to="/"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary"
          >
            <Wallet
              className="h-5 w-5 text-primary-foreground"
              aria-hidden="true"
            />
            <span className="sr-only">Expensio home</span>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign In To Your Expensio Account
          </p>
        </div>
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Your Password"
              />
              <ErrorMessage>{error}</ErrorMessage>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3" aria-hidden="true">
            {/* <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" /> */}
          </div>
          <GoogleButton onError={setError} />
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {"Don't Have An Account? "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
