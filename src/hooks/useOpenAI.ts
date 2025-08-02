import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface UseOpenAIReturn {
  generateResponse: (messages: Message[], model?: string) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export const useOpenAI = (): UseOpenAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateResponse = async (
    messages: Message[], 
    model: string = 'gpt-4.1-2025-04-14'
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('openai-chat', {
        body: { messages, model }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
      setError(errorMessage);
      toast({
        title: "OpenAI Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateResponse, isLoading, error };
};