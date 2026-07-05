import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, FileText, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MediaGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
}

export const MediaGalleryDialog: React.FC<MediaGalleryDialogProps> = ({
  open,
  onOpenChange,
  targetUserId
}) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<any[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (open && targetUserId) {
      fetchMedia();
    }
  }, [open, targetUserId]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/chat/${targetUserId}/media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (e) {
      console.error('Error fetching media:', e);
    }
    setLoading(false);
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col p-6 rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#9AC68A] dark:text-[#4ADE80]" /> Media, Links & Docs
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#9AC68A] dark:text-[#4ADE80]" />
          </div>
        ) : (
          <ScrollArea className="flex-1 mt-4 p-2 border border-black/5 dark:border-white/5 rounded-xl overflow-y-auto">
            {media.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {media.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:opacity-90 transition-all cursor-pointer"
                  >
                    {isImage(item.file_url) ? (
                      <img
                        src={item.file_url}
                        alt={item.file_name || 'Media'}
                        className="w-full h-full object-cover"
                        onClick={() => window.open(item.file_url, '_blank')}
                      />
                    ) : (
                      <div 
                        onClick={() => window.open(item.file_url, '_blank')}
                        className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
                      >
                        <FileText className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate w-full">
                          {item.file_name || 'Document'}
                        </span>
                      </div>
                    )}
                    <a
                      href={item.file_url}
                      download={item.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
                <ImageIcon className="w-8 h-8 opacity-30" />
                <p>No media files found in this chat.</p>
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
