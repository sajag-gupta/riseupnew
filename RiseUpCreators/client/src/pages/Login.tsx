import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Music, Eye, EyeOff, Chrome } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [location, navigate] = useLocation();
  const { login, isLoginPending, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data: LoginForm) => {
    login(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-ruc-black text-ruc-text pt-16 flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <Card className="bg-ruc-surface border-ruc-border">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 red-gradient rounded-2xl flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <p className="text-ruc-text-muted">Sign in to your Rise Up Creators account</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-ruc-surface-2 border-ruc-border focus:border-ruc-red"
                  {...register("email")}
                  data-testid="email-input"
                />
                {errors.email && (
                  <p className="text-sm text-ruc-danger">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="bg-ruc-surface-2 border-ruc-border focus:border-ruc-red pr-10"
                    {...register("password")}
                    data-testid="password-input"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-ruc-text-muted" />
                    ) : (
                      <Eye className="h-4 w-4 text-ruc-text-muted" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-ruc-danger">{errors.password.message}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <Link href="/forgot-password" className="text-sm text-ruc-red hover:text-ruc-orange">
                  Forgot password?
                </Link>
              </div>
              
              <Button
                type="submit"
                className="w-full red-gradient hover:shadow-red-glow"
                disabled={isLoginPending}
                data-testid="login-button"
              >
                {isLoginPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-ruc-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-ruc-surface px-2 text-ruc-text-muted">Or continue with</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full border-ruc-border hover:border-ruc-red"
              onClick={handleGoogleLogin}
              data-testid="google-login-button"
            >
              <Chrome className="w-4 h-4 mr-2" />
              Sign in with Google
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-ruc-text-muted">Don't have an account? </span>
              <Link href="/signup" className="text-ruc-red hover:text-ruc-orange font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
