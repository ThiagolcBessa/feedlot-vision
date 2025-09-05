import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Preflight connectivity check
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://tsydbthtusyaarthnrhv.supabase.co";
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeWRidGh0dXN5YWFydGhucmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MjE4MTAsImV4cCI6MjA3MjQ5NzgxMH0.AGglrhqk_FOY76id6ASNVPsCsm24VDUvYunsYoogpbU";
      
      // Check for missing environment variables
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setConnectionError("Missing Supabase env. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Lovable → Settings → Environment variables.");
        toast({
          variant: "destructive",
          title: "Configuração necessária",
          description: "Configure as variáveis de ambiente do Supabase em Lovable → Settings → Environment variables.",
        });
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
          headers: { apikey: SUPABASE_ANON_KEY }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        setConnectionError(null);
      } catch (error) {
        setConnectionError("Não foi possível conectar ao Supabase (verifique URL/ANON KEY e URLs de redirecionamento).");
      }
    };

    checkSupabaseConnection();
  }, [toast]);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const { error } = await signIn(email, password);
      
      if (error) {
        // Handle specific error types
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('CORS')) {
          toast({
            variant: "destructive",
            title: "Falha de conexão",
            description: "Falha ao contatar Supabase. Verifique URLs de redirecionamento e variáveis de ambiente.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro no login",
            description: error.message,
          });
        }
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Boitel JBS",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha de conexão",
        description: "Falha ao contatar Supabase. Verifique URLs de redirecionamento e variáveis de ambiente.",
      });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;

      const { error } = await signUp(email, password, firstName, lastName);
      
      if (error) {
        // Handle specific error types
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('CORS')) {
          toast({
            variant: "destructive",
            title: "Falha de conexão",
            description: "Falha ao contatar Supabase. Verifique URLs de redirecionamento e variáveis de ambiente.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro no cadastro",
            description: error.message,
          });
        }
      } else {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Verifique seu email para confirmar a conta",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha de conexão",
        description: "Falha ao contatar Supabase. Verifique URLs de redirecionamento e variáveis de ambiente.",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Boitel JBS</CardTitle>
          <CardDescription>
            Sistema de Simulação e Gestão de Confinamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Sobrenome"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}