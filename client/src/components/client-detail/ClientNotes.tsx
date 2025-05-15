import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ClientNote } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ClientNotesProps {
  clientId: number;
}

export default function ClientNotes({ clientId }: ClientNotesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isAddingNote, setIsAddingNote] = useState(false);
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
      setIsAddingNote(false);
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
        description: "Note text is required",
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

  const handleCancelAdd = () => {
    setIsAddingNote(false);
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
              <CardTitle className="text-sm">Client Notes</CardTitle>
            </div>
            {!isAddingNote && (
              <Button
                variant="outline" 
                size="sm"
                className="h-7 py-0 px-2 text-xs"
                onClick={() => setIsAddingNote(true)}
                disabled={isAddingNote}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Add Note
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 py-2">
          {isAddingNote && (
            <div className="mb-3 border p-3 rounded-md">
              <h3 className="font-medium text-sm mb-2">New Note</h3>
              <div className="space-y-2">
                <div>
                  <Input
                    type="text"
                    placeholder="Note Title"
                    className="h-8 text-sm"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Enter note text..."
                    className="text-sm"
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={handleCancelAdd}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={handleCreateNote} 
                    disabled={createNoteMutation.isPending}
                  >
                    {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {notes.length === 0 && !isAddingNote ? (
            <div className="text-center py-3 text-gray-500 text-xs">
              No notes available. Click "Add Note" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <Card key={note.id} className="border shadow-sm">
                  <CardHeader className="pb-1 pt-2 px-3">
                    <div className="flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto font-medium text-left hover:bg-transparent"
                        onClick={() => navigate(`/notes/${note.id}`)}
                      >
                        <CardTitle className="text-sm">{note.title}</CardTitle>
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => navigate(`/notes/${note.id}`)}
                          aria-label="Edit note"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={isAddingNote}
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0">
                      Updated: {note.lastUpdated ? format(new Date(note.lastUpdated), 'MMM d, yyyy') : 'Unknown'} • 
                      {(note.entries && Array.isArray(note.entries) && note.entries.length > 0) ? 
                        ` ${note.entries.length} entries` : 
                        " No entries"}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}