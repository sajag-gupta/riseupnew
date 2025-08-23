import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Music, Image, FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// ------------------------ Validation ------------------------
const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  genre: z.string().optional(),
  description: z.string().optional(),
  releaseDate: z.string().optional(),
  visibility: z.enum(["public", "subscriber_only", "private"]),
  isMonetized: z.boolean(),
  adEnabled: z.boolean(),
  price: z.number().min(0).optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

// ------------------------ Component ------------------------
export default function UploadMusic() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("single");
  const { toast } = useToast();

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      visibility: "public",
      isMonetized: true,
      adEnabled: true,
    },
  });

  // ------------------------ Handlers ------------------------
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Invalid file", description: "Select an audio file", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 100MB", variant: "destructive" });
      return;
    }
    setAudioFile(file);
    toast({ title: "Audio selected", description: file.name });
  };

  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setArtworkFile(file);
    toast({ title: "Artwork selected", description: file.name });
  };

  // ------------------------ Submit ------------------------
  const onSubmit = async (data: UploadForm) => {
  if (!audioFile) {
    toast({ title: "Audio required", description: "Please select an audio file", variant: "destructive" });
    return;
  }

  setIsUploading(true);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    formData.append("audioFile", audioFile);
    if (artworkFile) formData.append("artworkFile", artworkFile);

    // Build songData for backend
    const payload: any = {
      title: data.title,
      genre: data.genre,
      description: data.description,
      releaseDate: data.releaseDate
        ? new Date(data.releaseDate).toISOString()
        : new Date().toISOString(),
      visibility: data.visibility,
      monetization: {
        isMonetized: data.isMonetized,
        adEnabled: data.adEnabled,
      },
    };

    if (data.isMonetized && data.price !== undefined && !isNaN(data.price)) {
      payload.monetization.price = data.price;
    }

    formData.append("songData", JSON.stringify(payload));

    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) throw new Error("No token found");

    // ---------- Use XMLHttpRequest instead of fetch ----------
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/songs/upload", true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = (event.loaded / event.total) * 100;
        setUploadProgress(percent);
      }
    };

    // Handle response
    xhr.onload = () => {
      try {
        const resJson = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          toast({ title: "Upload successful", description: `${resJson.title} uploaded.` });

          // Reset form
          form.reset({ visibility: "public", isMonetized: true, adEnabled: true });
          setAudioFile(null);
          setArtworkFile(null);
          setUploadProgress(0);
        } else {
          throw new Error(resJson.error || resJson.message || "Upload failed");
        }
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    };

    xhr.onerror = () => {
      toast({ title: "Upload failed", description: "Network or server error", variant: "destructive" });
      setIsUploading(false);
    };

    xhr.send(formData);
  } catch (err: any) {
    toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    setIsUploading(false);
  }
};


  // ------------------------ Render ------------------------
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Music</h1>
        <p className="text-gray-500">Share your track with the world</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Track</TabsTrigger>
          <TabsTrigger value="album">Album/EP</TabsTrigger>
        </TabsList>

        {/* Single track */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Upload Single Track</CardTitle>
              <CardDescription>Audio + metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Audio */}
                <div>
                  <Label htmlFor="audio">Audio *</Label>
                  <input type="file" id="audio" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                  <Label htmlFor="audio" className="block border p-4 cursor-pointer text-center">
                    <FileAudio className="mx-auto mb-2" />
                    {audioFile ? audioFile.name : "Select audio file"}
                  </Label>
                </div>

                {/* Artwork */}
                <div>
                  <Label htmlFor="artwork">Artwork (Optional)</Label>
                  <input type="file" id="artwork" accept="image/*" className="hidden" onChange={handleArtworkUpload} />
                  <Label htmlFor="artwork" className="block border p-4 cursor-pointer text-center">
                    <Image className="mx-auto mb-2" />
                    {artworkFile ? artworkFile.name : "Select artwork"}
                  </Label>
                </div>

                {/* Title */}
                <div>
                  <Label>Title *</Label>
                  <Input {...form.register("title")} placeholder="Song title" />
                  {form.formState.errors.title && (
                    <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
                  )}
                </div>

                {/* Genre */}
                <div>
                  <Label>Genre</Label>
                  <Input {...form.register("genre")} placeholder="Pop, Rock..." />
                </div>

                {/* Description */}
                <div>
                  <Label>Description</Label>
                  <Textarea {...form.register("description")} placeholder="Describe your track" />
                </div>

                {/* Release Date */}
                <div>
                  <Label>Release Date</Label>
                  <Input type="date" {...form.register("releaseDate")} />
                </div>

                {/* Visibility */}
                <div>
                  <Label>Visibility</Label>
                  <RadioGroup
                    defaultValue="public"
                    onValueChange={(v) => form.setValue("visibility", v as any)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="subscriber_only" id="subscriber_only" />
                      <Label htmlFor="subscriber_only">Subscribers only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private">Private</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Monetization */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Monetization</Label>
                      <p className="text-sm text-gray-500">Allow purchase</p>
                    </div>
                    <Switch
                      checked={form.watch("isMonetized")}
                      onCheckedChange={(c) => form.setValue("isMonetized", c)}
                    />
                  </div>
                  {form.watch("isMonetized") && (
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price (USD)"
                      onChange={(e) =>
                        form.setValue("price", e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Ads</Label>
                      <p className="text-sm text-gray-500">Show ads before playback</p>
                    </div>
                    <Switch
                      checked={form.watch("adEnabled")}
                      onCheckedChange={(c) => form.setValue("adEnabled", c)}
                    />
                  </div>
                </div>

                {/* Progress */}
                {isUploading && (
                  <div>
                    <Label>Upload progress</Label>
                    <Progress value={uploadProgress} />
                    <p className="text-sm">{uploadProgress.toFixed(0)}%</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset({ visibility: "public", isMonetized: true, adEnabled: true });
                      setAudioFile(null);
                      setArtworkFile(null);
                    }}
                    disabled={isUploading}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={isUploading || !audioFile} className="bg-red-600 hover:bg-red-700">
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Song
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Album placeholder */}
        <TabsContent value="album">
          <Card>
            <CardHeader>
              <CardTitle>Upload Album/EP</CardTitle>
              <CardDescription>Feature coming soon</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Music className="mx-auto w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-500">Album upload is under development</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
