-- Create enum types for wine metadata
CREATE TYPE wine_type AS ENUM ('red', 'white', 'rose', 'sparkling', 'dessert', 'fortified');
CREATE TYPE wine_color AS ENUM ('light', 'medium', 'deep');
CREATE TYPE wine_body AS ENUM ('light', 'medium', 'full');
CREATE TYPE wine_sweetness AS ENUM ('bone_dry', 'dry', 'off_dry', 'medium_sweet', 'sweet');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wines table with detailed metadata
CREATE TABLE public.wines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  producer TEXT NOT NULL,
  vintage INTEGER,
  region TEXT,
  subregion TEXT,
  appellation TEXT,
  country TEXT NOT NULL,
  wine_type wine_type NOT NULL,
  grape_varieties TEXT[], -- Array of grape varieties
  alcohol_content DECIMAL(4,2), -- e.g., 13.5%
  color wine_color,
  body wine_body,
  sweetness wine_sweetness,
  serving_temp_min INTEGER, -- Celsius
  serving_temp_max INTEGER, -- Celsius
  drink_from INTEGER, -- Year
  drink_until INTEGER, -- Year
  cellar_tracker_id TEXT, -- For CellarTracker integration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wine_cellar table to track user's wine inventory
CREATE TABLE public.wine_cellar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_id UUID NOT NULL REFERENCES public.wines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  storage_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, wine_id)
);

-- Create wine_ratings table for Robert Parker style ratings
CREATE TABLE public.wine_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_id UUID NOT NULL REFERENCES public.wines(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 50 AND rating <= 100), -- Robert Parker scale
  tasting_date DATE,
  tasting_notes TEXT,
  food_pairing TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, wine_id) -- One rating per user per wine
);

-- Create user_friendships table for friend relationships
CREATE TABLE public.user_friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_cellar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_friendships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for wines (viewable by everyone for now)
CREATE POLICY "Wines are viewable by everyone" 
ON public.wines 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create wines" 
ON public.wines 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create RLS policies for wine_cellar
CREATE POLICY "Users can view their own cellar" 
ON public.wine_cellar 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' cellars"
ON public.wine_cellar
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_friendships
    WHERE ((requester_id = auth.uid() AND addressee_id = user_id) 
           OR (addressee_id = auth.uid() AND requester_id = user_id))
    AND status = 'accepted'
  )
);

CREATE POLICY "Users can manage their own cellar" 
ON public.wine_cellar 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for wine_ratings
CREATE POLICY "Users can view their own ratings" 
ON public.wine_ratings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' ratings"
ON public.wine_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_friendships
    WHERE ((requester_id = auth.uid() AND addressee_id = user_id) 
           OR (addressee_id = auth.uid() AND requester_id = user_id))
    AND status = 'accepted'
  )
);

CREATE POLICY "Users can manage their own ratings" 
ON public.wine_ratings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_friendships
CREATE POLICY "Users can view their own friendship requests" 
ON public.user_friendships 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friendship requests" 
ON public.user_friendships 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendship requests they're involved in" 
ON public.user_friendships 
FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_wines_updated_at
  BEFORE UPDATE ON public.wines
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_wine_cellar_updated_at
  BEFORE UPDATE ON public.wine_cellar
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_wine_ratings_updated_at
  BEFORE UPDATE ON public.wine_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_friendships_updated_at
  BEFORE UPDATE ON public.user_friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();