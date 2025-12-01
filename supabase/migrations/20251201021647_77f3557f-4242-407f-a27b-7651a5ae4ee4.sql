-- Create livestream table
CREATE TABLE public.livestream (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  stream_call_id TEXT NOT NULL,
  stream_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.livestream ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active livestreams"
ON public.livestream
FOR SELECT
USING (status = 'active');

CREATE POLICY "Users can create their own livestreams"
ON public.livestream
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own livestreams"
ON public.livestream
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_livestream_updated_at
BEFORE UPDATE ON public.livestream
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream;