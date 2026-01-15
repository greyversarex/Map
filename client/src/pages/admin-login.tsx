import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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
        setShowWelcome(true);
        setTimeout(() => {
          setLocation("/admin");
        }, 2500);
      } else {
        toast({ 
          title: "Ошибка", 
          description: data.message || "Неверный логин или пароль",
          variant: "destructive" 
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({ 
        title: "Ошибка", 
        description: "Не удалось подключиться к серверу",
        variant: "destructive" 
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4">
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="inline-block"
              >
                <Sparkles className="h-16 w-16 text-amber-500" />
              </motion.div>
            </motion.div>
            
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-black mb-4"
            >
              Хуш омадед акаи Сарвар!
            </motion.h1>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.8, duration: 1.2 }}
              className="h-1 bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400 rounded-full mx-auto max-w-md"
            />
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="text-gray-600 mt-4 text-lg"
            >
              Переход в панель управления...
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-gray-300/50 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 text-center">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
