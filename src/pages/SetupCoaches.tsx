import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const coaches = [
  { email: "coach@app.com", password: "coach123", name: "Coach" },
  { email: "mary@app.com", password: "mary123", name: "Mary" },
  { email: "john@app.com", password: "john123", name: "John" },
  { email: "martin@app.com", password: "martin123", name: "Martin" },
];

const SetupCoaches = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { toast } = useToast();

  const createCoaches = async () => {
    setLoading(true);
    setResults([]);
    const newResults: string[] = [];

    for (const coach of coaches) {
      try {
        // Sign up the coach user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: coach.email,
          password: coach.password,
          options: {
            data: {
              display_name: coach.name,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (signUpError) {
          newResults.push(`❌ ${coach.name}: ${signUpError.message}`);
          continue;
        }

        if (!authData.user) {
          newResults.push(`❌ ${coach.name}: User creation failed`);
          continue;
        }

        // Add coach role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'coach',
          });

        if (roleError) {
          newResults.push(`⚠️ ${coach.name}: Created but role assignment failed - ${roleError.message}`);
          continue;
        }

        // Set online status
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_online: true })
          .eq('id', authData.user.id);

        if (profileError) {
          newResults.push(`⚠️ ${coach.name}: Created but profile update failed`);
          continue;
        }

        newResults.push(`✅ ${coach.name}: Created successfully (${coach.email})`);
      } catch (error: any) {
        newResults.push(`❌ ${coach.name}: ${error.message}`);
      }
    }

    setResults(newResults);
    setLoading(false);

    toast({
      title: "Setup Complete",
      description: "Check the results below",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Setup Coach Accounts</CardTitle>
          <CardDescription>
            This will create 4 coach accounts that users can chat with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="font-semibold">Coach Credentials:</p>
            {coaches.map((coach) => (
              <div key={coach.email} className="text-sm">
                <span className="font-medium">{coach.name}:</span> {coach.email} / {coach.password}
              </div>
            ))}
          </div>

          <Button
            onClick={createCoaches}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Coaches...
              </>
            ) : (
              'Create Coach Accounts'
            )}
          </Button>

          {results.length > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="font-semibold mb-2">Results:</p>
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Note: You only need to run this once. Navigate to /setup-coaches to access this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupCoaches;
