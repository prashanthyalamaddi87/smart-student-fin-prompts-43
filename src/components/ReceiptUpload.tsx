import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptUploadProps {
  onTransactionExtracted: (transaction: any) => void;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ onTransactionExtracted }) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const processImage = async (file: File) => {
    setProcessing(true);
    setProgress(20);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(file);
      });

      setProgress(50);

      // Process with AI OCR
      const { data, error } = await supabase.functions.invoke('process-receipt', {
        body: { imageBase64: base64 }
      });

      if (error) throw error;

      setProgress(80);

      if (data.success) {
        onTransactionExtracted(data.data);
        toast({
          title: "Receipt processed successfully! 🎉",
          description: "Transaction data has been extracted and added.",
        });
      } else {
        throw new Error(data.error);
      }

      setProgress(100);
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process receipt",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    await processImage(file);
  }, [onTransactionExtracted, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    disabled: uploading || processing
  });

  return (
    <Card className="p-6 bg-gradient-card border-primary/20 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Receipt Scanner</h3>
          <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
            AI Powered
          </Badge>
        </div>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
            }
            ${(uploading || processing) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {processing ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Processing receipt...</p>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  AI is extracting transaction data from your receipt
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                {isDragActive ? (
                  <Upload className="w-12 h-12 text-primary animate-bounce" />
                ) : (
                  <FileImage className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your receipt here!' : 'Upload Receipt'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop or click to upload a receipt image
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Supports JPG, PNG, GIF (max 10MB)
                </p>
              </div>

              <Button 
                variant="outline" 
                className="mt-4"
                disabled={uploading || processing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="w-3 h-3 text-success" />
          <span>AI extracts amount, category, and description automatically</span>
        </div>
      </div>
    </Card>
  );
};