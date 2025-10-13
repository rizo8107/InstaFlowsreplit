import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Instagram } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, register, loginError, registerError } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      } else {
        await register({ email, password });
        toast({
          title: "Account created!",
          description: "You've successfully registered.",
        });
      }
      setLocation("/");
    } catch (error: any) {
      toast({
        title: isLogin ? "Login failed" : "Registration failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E4405F] via-[#C13584] to-[#833AB4] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-[#E4405F] via-[#C13584] to-[#833AB4]">
              <Instagram className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Instagram Automation</h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            {(loginError || registerError) && (
              <p className="text-sm text-destructive">
                {(loginError as Error)?.message || (registerError as Error)?.message}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#E4405F] via-[#C13584] to-[#833AB4] hover:opacity-90"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail("");
                setPassword("");
              }}
              data-testid="button-toggle-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
