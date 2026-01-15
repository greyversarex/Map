import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: trimmedUsername, 
          password: trimmedPassword 
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
        toast({ title: "Успешно!", description: "Вы вошли в систему" });
        setLocation("/admin");
      } else {
        toast({ 
          title: "Ошибка", 
          description: data.message || "Неверный логин или пароль",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Ошибка", 
        description: "Не удалось подключиться к серверу",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-300/50 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Панель администратора</h1>
            <p className="text-white/80 text-sm mt-1">Войдите для управления локациями</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-black font-medium">Логин</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  autoComplete="username"
                  required
                  className="h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500"
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black font-medium">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    autoComplete="current-password"
                    required
                    className="h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gray-500 focus:ring-gray-500 pr-12"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold text-base shadow-lg shadow-gray-400/50" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Вход..." : "Войти"}
              </Button>
            </form>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-center text-sm text-gray-500">
                Логин: <span className="font-mono text-black bg-gray-100 px-2 py-0.5 rounded">admin</span>
              </p>
              <p className="text-center text-sm text-gray-500 mt-1">
                Пароль: <span className="font-mono text-black bg-gray-100 px-2 py-0.5 rounded">admin123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
