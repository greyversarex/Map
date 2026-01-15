import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, Sparkles, Star, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FloatingParticle = ({ delay, x, size }: { delay: number; x: number; size: number }) => (
  <motion.div
    initial={{ y: 100, x, opacity: 0, scale: 0 }}
    animate={{ 
      y: -200, 
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1, 0.5],
      rotate: [0, 180, 360]
    }}
    transition={{ 
      delay, 
      duration: 3,
      repeat: Infinity,
      repeatDelay: 1
    }}
    className="absolute"
    style={{ left: `${x}%` }}
  >
    <Star className={`text-amber-400`} style={{ width: size, height: size }} />
  </motion.div>
);

const PulseRing = ({ delay, size }: { delay: number; size: number }) => (
  <motion.div
    initial={{ scale: 0.5, opacity: 0.8 }}
    animate={{ scale: 2.5, opacity: 0 }}
    transition={{ 
      delay,
      duration: 2,
      repeat: Infinity,
      repeatDelay: 0.5
    }}
    className="absolute rounded-full border-2 border-amber-400/50"
    style={{ width: size, height: size }}
  />
);

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
        }, 5000);
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4 overflow-hidden">
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col items-center justify-center"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <FloatingParticle delay={0} x={10} size={16} />
              <FloatingParticle delay={0.3} x={25} size={12} />
              <FloatingParticle delay={0.6} x={40} size={20} />
              <FloatingParticle delay={0.2} x={55} size={14} />
              <FloatingParticle delay={0.5} x={70} size={18} />
              <FloatingParticle delay={0.8} x={85} size={16} />
              <FloatingParticle delay={0.4} x={95} size={12} />
            </div>

            <div className="relative flex items-center justify-center mb-8">
              <PulseRing delay={0} size={120} />
              <PulseRing delay={0.5} size={120} />
              <PulseRing delay={1} size={120} />
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2
                }}
                className="relative z-10 flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-300/50"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 0.5
                  }}
                >
                  <MapPin className="h-14 w-14 text-white drop-shadow-lg" />
                </motion.div>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
              className="text-center relative z-10"
            >
              <motion.h1
                className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 mb-2"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                Хуш омадед
              </motion.h1>
              
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6, type: "spring" }}
                className="flex items-center justify-center gap-3 mt-2"
              >
                <Sparkles className="h-6 w-6 text-amber-500" />
                <span className="text-3xl md:text-4xl font-bold text-black">
                  акаи Сарвар!
                </span>
                <Sparkles className="h-6 w-6 text-amber-500" />
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
              className="w-80 h-1.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mt-8"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              <p className="text-gray-600 text-lg">Переход в панель управления</p>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-3 h-3 rounded-full bg-gray-500"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            transition={{ duration: 0.4 }}
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
