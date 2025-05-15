import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ClientNote } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface ClientNotesProps {
  clientId: number;
}

export default function ClientNotes({ clientId }: ClientNotesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  // Fetch client notes
  const { 
    data: notes = [], 
    isLoading, 
    isError 
  } = useQuery<ClientNote[]>({
    queryKey: [`/api/clients/${clientId}/notes`],
    enabled: !!clientId
  });

  // Create a new note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: { title: string; entries: { text: string; date: string | Date }[] }) => {
      const res = await apiRequest("POST", `/api/clients/${clientId}/notes`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/notes`] });
      setDialogOpen(false);
      setNewNoteTitle("");
      setNewNoteText("");
      toast({
        title: "Note created",
        description: "Your note has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create note: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete a note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const res = await apiRequest("DELETE", `/api/clients/${clientId}/notes/${noteId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/notes`] });
      toast({
        title: "Note deleted",
        description: "The note has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete note: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) {
      toast({
        title: "Error",
        description: "Note title is required",
        variant: "destructive",
      });
      return;
    }

    if (!newNoteText.trim()) {
      toast({
        title: "Error",
        description: "Note content is required",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate({
      title: newNoteTitle,
      entries: [{ text: newNoteText, date: new Date() }]
    });
  };

  const handleDeleteNote = (noteId: number) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const openDialog = () => {
    setDialogOpen(true);
    setNewNoteTitle("");
    setNewNoteText("");
  };

  if (isLoading) {
    return (
      <div className="pt-4">
        <Card className="overflow-hidden">
          <CardHeader className="py-2 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Client Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <div className="text-center py-2 text-gray-500 text-xs">
              Loading notes...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pt-4">
        <Card className="overflow-hidden">
          <CardHeader className="py-2 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Client Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <div className="text-center py-2 text-red-500 text-xs">
              Error loading notes
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <Card className="overflow-hidden">
        <CardHeader className="py-2 px-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Client Notes</CardTitle>
            </div>
            <Button
              size="sm"
              className="h-7 py-0 px-2 text-xs"
              onClick={openDialog}
            >
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-4">
          {notes.length === 0 ? (
            <div className="text-center py-3 text-gray-500 text-xs">
              No notes available. Click "Add Note" to create one.
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <tbody>
                  {notes.map((note, index) => (
                    <tr 
                      key={note.id}
                      className={`${index > 0 ? 'border-t' : ''} hover:bg-gray-50 cursor-pointer`}
                      onClick={() => navigate(`/notes/${note.id}`)}
                    >
                      <td className="px-3 py-3 text-base">{note.title}</td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        {note.lastUpdated ? format(new Date(note.lastUpdated), 'MMM d, yyyy') : 'Unknown'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">
                        {(note.entries && Array.isArray(note.entries) && note.entries.length > 0) ? 
                          `${note.entries.length} entries` : 
                          "No entries"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
            <DialogDescription>
              Create a new note for this client with title and content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-base font-medium">
                Note Title
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Enter note title"
                value={newNoteTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNoteTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="content" className="text-base font-medium">
                Note Content
              </label>
              <RichTextEditor
                content={newNoteText}
                onChange={setNewNoteText}
                placeholder="Enter note content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNote}
              disabled={createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}