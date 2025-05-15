import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientNote } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface ClientNotesProps {
  clientId: number;
}

export default function ClientNotes({ clientId }: ClientNotesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [editingNoteText, setEditingNoteText] = useState("");

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

  // Update a note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ 
      noteId, 
      data 
    }: { 
      noteId: number; 
      data: { 
        title?: string; 
        entries?: Array<{ text: string; date?: string | Date }> 
      } 
    }) => {
      const res = await apiRequest("PATCH", `/api/clients/${clientId}/notes/${noteId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/notes`] });
      setEditingNoteId(null);
      setEditingNoteTitle("");
      setEditingNoteText("");
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update note: ${error.message}`,
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

  const handleUpdateNote = (noteId: number) => {
    if (!editingNoteTitle.trim()) {
      toast({
        title: "Error",
        description: "Note title is required",
        variant: "destructive",
      });
      return;
    }

    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Get the existing entries
    let entries = [...(note.entries as Array<{ text: string; date: string | Date }> || [])];

    // Add the new entry if there's text
    if (editingNoteText.trim()) {
      entries.unshift({ text: editingNoteText, date: new Date() });
    }

    updateNoteMutation.mutate({
      noteId,
      data: {
        title: editingNoteTitle,
        entries
      }
    });
  };

  const handleEditNote = (note: ClientNote) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteText(""); // Clear text for a new entry
  };

  const handleDeleteNote = (noteId: number) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteTitle("");
    setEditingNoteText("");
  };

  const handleCancelAdd = () => {
    setIsAddingNote(false);
    setNewNoteTitle("");
    setNewNoteText("");
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Notes</CardTitle>
            <CardDescription>Loading notes...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Notes</CardTitle>
            <CardDescription className="text-red-500">Error loading notes</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Client Notes</CardTitle>
            </div>
            {!isAddingNote && (
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setIsAddingNote(true)}
                disabled={isAddingNote || editingNoteId !== null}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isAddingNote && (
            <div className="mb-6 border p-4 rounded-md">
              <h3 className="font-medium text-lg mb-2">New Note</h3>
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Note Title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Enter note text..."
                    rows={4}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelAdd}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNote} disabled={createNoteMutation.isPending}>
                    {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {notes.length === 0 && !isAddingNote ? (
            <div className="text-center py-6 text-gray-500">
              No notes available. Click "Add Note" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="border shadow-sm">
                  <CardHeader className="pb-2">
                    {editingNoteId === note.id ? (
                      <Input
                        type="text"
                        value={editingNoteTitle}
                        onChange={(e) => setEditingNoteTitle(e.target.value)}
                        className="font-medium text-lg"
                      />
                    ) : (
                      <div className="flex justify-between items-center">
                        <CardTitle>{note.title}</CardTitle>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note)}
                            disabled={isAddingNote || editingNoteId !== null}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={isAddingNote || editingNoteId !== null}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <CardDescription>
                      Last updated: {note.lastUpdated ? format(new Date(note.lastUpdated), 'MMM d, yyyy h:mm a') : 'Unknown'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingNoteId === note.id && (
                      <div className="mb-4">
                        <Textarea
                          placeholder="Add a new entry..."
                          rows={3}
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="mb-2"
                        />
                        <CardDescription>
                          This will add a new entry at the top of the note history
                        </CardDescription>
                      </div>
                    )}
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-3">
                        {(note.entries as { text: string; date: string }[] || []).map((entry, index) => (
                          <div key={index} className="text-sm">
                            <div className="text-gray-500 text-xs mb-1">
                              {format(new Date(entry.date), 'MMM d, yyyy h:mm a')}
                            </div>
                            <div className="text-gray-800 whitespace-pre-wrap">{entry.text}</div>
                            {index < (note.entries as { text: string; date: string }[]).length - 1 && (
                              <Separator className="my-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  {editingNoteId === note.id && (
                    <CardFooter className="flex justify-end space-x-2 pb-4">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={updateNoteMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" /> 
                        {updateNoteMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}