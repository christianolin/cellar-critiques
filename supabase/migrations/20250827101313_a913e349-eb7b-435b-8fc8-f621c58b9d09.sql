-- Add bottle_size column to wines table
ALTER TABLE wines ADD COLUMN bottle_size text DEFAULT '750ml';

-- Create wine images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('wine-images', 'wine-images', true);

-- Create storage policies for wine images
CREATE POLICY "Wine images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wine-images');

CREATE POLICY "Authenticated users can upload wine images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'wine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update wine images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'wine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete wine images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'wine-images' AND auth.role() = 'authenticated');

-- Add image_url column to wines table
ALTER TABLE wines ADD COLUMN image_url text;