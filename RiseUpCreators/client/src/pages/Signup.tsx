import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, Eye, EyeOff, Chrome, Heart, Mic } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["fan", "artist"], {
    required_error: "Please select your role",
  }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [location, navigate] = useLocation();
  const { signup, isSignupPending, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Get role from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const roleParam = urlParams.get('role') as "fan" | "artist" | null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: roleParam || "fan",
    },
  });

  const selectedRole = watch("role");
  const acceptTerms = watch("acceptTerms");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data: SignupForm) => {
    const { acceptTerms, ...signupData } = data;
    signup(signupData);
  };

  const handleGoogleSignup = () => {
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
            <CardTitle className="text-2xl font-bold">Join Rise Up Creators</CardTitle>
            <p className="text-ruc-text-muted">Create your account and start your music journey</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="bg-ruc-surface-2 border-ruc-border focus:border-ruc-red"
                  {...register("name")}
                  data-testid="name-input"
                />
                {errors.name && (
                  <p className="text-sm text-ruc-danger">{errors.name.message}</p>
                )}
              </div>
              
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
                    placeholder="Create a password"
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
              
              <div className="space-y-3">
                <Label>I want to join as:</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setValue("role", value as "fan" | "artist")}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 border border-ruc-border rounded-lg hover:border-ruc-red cursor-pointer">
                    <RadioGroupItem value="fan" id="fan" />
                    <div className="flex items-center space-x-3 flex-1">
                      <Heart className="w-5 h-5 text-ruc-red" />
                      <div>
                        <Label htmlFor="fan" className="cursor-pointer font-medium">Music Fan</Label>
                        <p className="text-sm text-ruc-text-muted">Discover and support artists</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border border-ruc-border rounded-lg hover:border-ruc-red cursor-pointer">
                    <RadioGroupItem value="artist" id="artist" />
                    <div className="flex items-center space-x-3 flex-1">
                      <Mic className="w-5 h-5 text-ruc-red" />
                      <div>
                        <Label htmlFor="artist" className="cursor-pointer font-medium">Music Artist</Label>
                        <p className="text-sm text-ruc-text-muted">Upload and monetize your music</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
                {errors.role && (
                  <p className="text-sm text-ruc-danger">{errors.role.message}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setValue("acceptTerms", !!checked)}
                  data-testid="terms-checkbox"
                />
                <Label htmlFor="terms" className="text-sm text-ruc-text-muted cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-ruc-red hover:text-ruc-orange">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-ruc-red hover:text-ruc-orange">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-ruc-danger">{errors.acceptTerms.message}</p>
              )}
              
              <Button
                type="submit"
                className="w-full red-gradient hover:shadow-red-glow"
                disabled={isSignupPending}
                data-testid="signup-button"
              >
                {isSignupPending ? "Creating account..." : "Create Account"}
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
              onClick={handleGoogleSignup}
              data-testid="google-signup-button"
            >
              <Chrome className="w-4 h-4 mr-2" />
              Sign up with Google
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-ruc-text-muted">Already have an account? </span>
              <Link href="/login" className="text-ruc-red hover:text-ruc-orange font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
