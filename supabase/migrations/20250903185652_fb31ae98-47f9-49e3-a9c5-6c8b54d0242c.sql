-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);

-- Create policies for upload access
CREATE POLICY "Users can view their own uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert default input seeds
INSERT INTO inputs (name, unit, price, vendor, notes, created_by) 
SELECT 'Milho', 'kg', 0.50, 'Fornecedor Padrão', 'Insumo básico para ração', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM inputs WHERE name = 'Milho');

INSERT INTO inputs (name, unit, price, vendor, notes, created_by)
SELECT 'Ração', 'kg', 1.20, 'Fornecedor Padrão', 'Ração balanceada', auth.uid()  
WHERE NOT EXISTS (SELECT 1 FROM inputs WHERE name = 'Ração');

INSERT INTO inputs (name, unit, price, vendor, notes, created_by)
SELECT 'Suplementos', 'kg', 2.50, 'Fornecedor Padrão', 'Suplementos nutricionais', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM inputs WHERE name = 'Suplementos');