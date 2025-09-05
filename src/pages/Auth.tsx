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
import { AlertCircle, Wifi, CheckCircle } from 'lucide-react';

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Constants for Supabase connection
  const SUPABASE_URL = "https://tsydbthtusyaarthnrhv.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeWRidGh0dXN5YWFydGhucmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MjE4MTAsImV4cCI6MjA3MjQ5NzgxMH0.AGglrhqk_FOY76id6ASNVPsCsm24VDUvYunsYoogpbU";

  // Log connection details for debugging
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Anon Key prefix:', SUPABASE_ANON_KEY.substring(0, 10) + '...');

  const pingSupabase = async () => {
    setTesting(true);
    setConnectionError(null);
    setConnectionStatus(null);

    try {
      // Check if we have the required configuration
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        const message = "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY";
        setConnectionError(message);
        console.error(message);
        return;
      }

      console.log('Testing connection to:', `${SUPABASE_URL}/auth/v1/settings`);
      
      const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { 
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        const message = "Conexão OK (settings 200)";
        setConnectionStatus(message);
        setConnectionError(null);
        console.log(message);
      } else if (response.status === 403) {
        const message = "API key inválida (use ANON, não service_role)";
        setConnectionError(message);
        console.error(message, 'Key prefix:', SUPABASE_ANON_KEY.substring(0, 10));
      } else if (response.status === 404) {
        const message = "URL do projeto incorreta (verifique VITE_SUPABASE_URL)";
        setConnectionError(message);
        console.error(message);
      } else {
        const body = await response.text().catch(() => 'Unable to read response');
        const message = `HTTP ${response.status}: ${body.substring(0, 100)}`;
        setConnectionError(message);
        console.error(message);
      }
    } catch (error) {
      let message = "Erro desconhecido";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        message = "Falha de rede/SSL (proxy/antivírus). Peça bypass para *.supabase.co/*.supabase.in e *.lovable.dev/*.lovable.app.";
      } else if (error instanceof Error) {
        if (error.message.includes('SSL') || error.message.includes('certificate')) {
          message = "Falha de rede/SSL (proxy/antivírus). Peça bypass para *.supabase.co/*.supabase.in e *.lovable.dev/*.lovable.app.";
        } else {
          message = `Erro de rede: ${error.message}`;
        }
      }
      
      setConnectionError(message);
      console.error('Connection test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  // Preflight connectivity check on mount
  useEffect(() => {
    pingSupabase();
  }, []);

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

      console.log('Attempting sign in for:', email);
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Sign in error:', error);
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message,
        });
      } else {
        console.log('Sign in successful');
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Boitel JBS",
        });
      }
    } catch (error) {
      console.error('Network error during sign in:', error);
      let message = "Falha ao contatar Supabase (rede/SSL).";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        message = "Falha ao contatar Supabase (rede/SSL).";
      }
      
      toast({
        variant: "destructive",
        title: "Falha de conexão",
        description: message,
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

      console.log('Attempting sign up for:', email);
      const { error } = await signUp(email, password, firstName, lastName);
      
      if (error) {
        console.error('Sign up error:', error);
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: error.message,
        });
      } else {
        console.log('Sign up successful');
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Verifique seu email para confirmar a conta",
        });
      }
    } catch (error) {
      console.error('Network error during sign up:', error);
      let message = "Falha ao contatar Supabase (rede/SSL).";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        message = "Falha ao contatar Supabase (rede/SSL).";
      }
      
      toast({
        variant: "destructive",
        title: "Falha de conexão",
        description: message,
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
          {/* Connection Diagnostics */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pingSupabase}
                disabled={testing}
                className="flex items-center gap-2"
              >
                <Wifi className="h-4 w-4" />
                {testing ? "Testando..." : "Testar conexão com Supabase"}
              </Button>
            </div>
            
            {connectionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{connectionError}</AlertDescription>
              </Alert>
            )}
            
            {connectionStatus && (
              <Alert variant="default" className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-800">{connectionStatus}</AlertDescription>
              </Alert>
            )}
          </div>
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