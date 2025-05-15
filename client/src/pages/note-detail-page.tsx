import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, Save, Plus, Check, X, Trash2, Edit } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/RichTextEditor";
import RichTextContent from "@/components/RichTextContent";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClientNote } from "@shared/schema";
import { useState, useRef } from "react";

export default function NoteDetailPage() {
  const { noteId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [newEntryText, setNewEntryText] = useState("");
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);
  const [editingEntryText, setEditingEntryText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteNoteDialogOpen, setDeleteNoteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  // Fetch the note data
  const { data: note, isLoading, error } = useQuery<ClientNote>({
    queryKey: [`/api/notes/${noteId}`],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${noteId}`);
      if (!res.ok) throw new Error("Failed to fetch note");
      return res.json();
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ 
      title, 
      text, 
      entries 
    }: { 
      title?: string; 
      text?: string; 
      entries?: { text: string; date: string }[] 
    }) => {
      const updateData: any = {};
      
      if (title !== undefined) {
        updateData.title = title;
      }
      
      if (text !== undefined) {
        // Add a new entry if text is provided
        const newEntry = {
          text,
          date: new Date().toISOString(),
        };
        
        const currentEntries = note?.entries && Array.isArray(note.entries) ? [...note.entries] : [];
        updateData.entries = [newEntry, ...currentEntries];
      }
      
      if (entries !== undefined) {
        // If entries is provided directly, use it to replace the current entries
        updateData.entries = entries;
      }
      
      const res = await apiRequest(
        "PATCH",
        `/api/notes/${noteId}`,
        updateData
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${noteId}`] });
      setIsEditing(false);
      setNewEntryText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      // Store the client ID before deleting the note
      const clientId = note?.clientId;
      
      await apiRequest(
        "DELETE",
        `/api/notes/${noteId}`,
        {}
      );
      
      return { clientId };
    },
    onSuccess: (data) => {
      toast({
        title: "Note deleted",
        description: "The note has been permanently deleted.",
      });
      
      if (data.clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/clients', data.clientId, 'notes'] });
        navigate(`/clients/${data.clientId}`);
      } else {
        navigate('/');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateTitle = () => {
    if (editingTitle.trim() === "") return;
    updateNoteMutation.mutate({ title: editingTitle });
  };

  const handleAddEntry = () => {
    if (newEntryText.trim() === "") return;
    updateNoteMutation.mutate({ text: newEntryText });
  };

  const handleStartEditing = () => {
    if (note) {
      setEditingTitle(note.title);
      setIsEditing(true);
    }
  };
  
  const handleStartEditingEntry = (index: number) => {
    if (note && note.entries && Array.isArray(note.entries)) {
      const entry = note.entries[index] as { text: string; date: string };
      setEditingEntryIndex(index);
      setEditingEntryText(entry.text);
    }
  };
  
  const handleUpdateEntry = () => {
    if (editingEntryIndex === null || !note || !note.entries || !Array.isArray(note.entries)) return;
    
    if (editingEntryText.trim() === "") {
      // Open delete dialog for the current editing entry
      openDeleteEntryDialog(editingEntryIndex);
      return;
    }
    
    const updatedEntries = [...note.entries];
    updatedEntries[editingEntryIndex] = {
      ...updatedEntries[editingEntryIndex],
      text: editingEntryText
    };
    
    updateNoteMutation.mutate({ 
      entries: updatedEntries as { text: string; date: string }[]
    });
    
    setEditingEntryIndex(null);
    setEditingEntryText("");
  };
  
  const handleCancelEditEntry = () => {
    setEditingEntryIndex(null);
    setEditingEntryText("");
  };
  
  const openDeleteEntryDialog = (index: number) => {
    setEntryToDelete(index);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteEntry = () => {
    if (entryToDelete === null || !note || !note.entries || !Array.isArray(note.entries)) return;
    
    const updatedEntries = (note.entries as { text: string; date: string }[]).filter((_, i) => i !== entryToDelete);
    
    updateNoteMutation.mutate({ 
      entries: updatedEntries
    });
    
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loading Note...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Error</CardTitle>
            <CardDescription className="text-red-500">
              {error ? error.message : "Note not found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              note?.clientId ? navigate(`/clients/${note.clientId}`) : navigate("/");
            }}
            className="text-blue-600 hover:text-blue-800 inline-flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Client
          </a>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              {isEditing ? (
                <div className="flex items-center space-x-2 w-full">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="font-medium text-lg"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleUpdateTitle}
                    disabled={updateNoteMutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <CardTitle className="text-xl">{note.title}</CardTitle>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={handleStartEditing}
                    className="h-8 w-8 p-0"
                    aria-label="Edit title"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <CardDescription>
              Client Note | Last updated: {note.lastUpdated ? format(new Date(note.lastUpdated), 'MMM d, yyyy h:mm a') : 'Unknown'}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <RichTextEditor
                content={newEntryText}
                onChange={setNewEntryText}
                placeholder="Add a new note entry..."
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddEntry}
                  disabled={updateNoteMutation.isPending || newEntryText.trim() === ""}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {updateNoteMutation.isPending ? "Adding..." : "Add Entry"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Note History</CardTitle>
          </CardHeader>
          <CardContent>
            {(note.entries as { text: string; date: string }[] || []).length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No entries yet. Add your first entry above.
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {(note.entries as { text: string; date: string }[] || []).map((entry, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-gray-500 text-sm font-medium">
                          {format(new Date(entry.date), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleStartEditingEntry(index)}
                            aria-label="Edit entry"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteEntryDialog(index)}
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      {editingEntryIndex === index ? (
                        <div className="space-y-3">
                          <RichTextEditor
                            content={editingEntryText}
                            onChange={setEditingEntryText}
                            placeholder="Edit entry..."
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEditEntry}
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUpdateEntry}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <RichTextContent content={entry.text} className="text-gray-800" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-8 border-t pt-6 flex justify-center">
          <Button 
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={() => setDeleteNoteDialogOpen(true)}
            disabled={deleteNoteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteNoteMutation.isPending ? "Deleting..." : "Delete this note"}
          </Button>
        </div>
      </div>

      {/* Delete Entry Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected note entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEntry}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Note Confirmation Dialog */}
      <AlertDialog open={deleteNoteDialogOpen} onOpenChange={setDeleteNoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteNoteMutation.mutate()}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}