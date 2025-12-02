"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Plus,
  Search,
  Star,
  MoreVertical,
  Calendar,
  Archive,
  Trash2,
  Edit,
  Folder,
  FolderPlus,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { IdeaDialog } from "@/components/ideas/idea-dialog";
import { toast } from "sonner";
import { ideaService, ideaFolderService } from "@/lib/db/services";
import { useMemoryExtractor } from "@/lib/memory";
import type { Idea, IdeaFolder } from "@/lib/db";

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  in_progress: "bg-yellow-500",
  used: "bg-green-500",
  archived: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  used: "Used",
  archived: "Archived",
};

export default function IdeasPage() {
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [folders, setFolders] = useState<IdeaFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  // Folder dialog state
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<IdeaFolder | null>(null);

  const { extractFromIdea } = useMemoryExtractor();

  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);
    try {
      const [ideasData, foldersData] = await Promise.all([
        ideaService.getAll({
          accountId: selectedAccountId,
          status: statusFilter !== "all" ? statusFilter as Idea["status"] : undefined,
          priority: priorityFilter !== "all" ? parseInt(priorityFilter) : undefined,
        }),
        ideaFolderService.getByAccountId(selectedAccountId),
      ]);
      setIdeas(ideasData);
      setFolders(foldersData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load ideas");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (ideaId: string, newStatus: Idea["status"]) => {
    try {
      await ideaService.update(ideaId, { status: newStatus });
      toast.success("Idea updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update idea");
    }
  };

  const handleMoveToFolder = async (ideaId: string, folderId: string | null) => {
    try {
      await ideaService.update(ideaId, { folderId });
      toast.success(folderId ? "Moved to folder" : "Moved to Uncategorized");
      fetchData();
    } catch (error) {
      toast.error("Failed to move idea");
    }
  };

  const handleDelete = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;

    try {
      await ideaService.delete(ideaId);
      toast.success("Idea deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete idea");
    }
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setIsDialogOpen(true);
  };

  const handleIdeaSaved = async (idea: Idea) => {
    // Extract memory from the idea (runs in background)
    if (selectedAccountId) {
      extractFromIdea(selectedAccountId, {
        title: idea.title,
        description: idea.description,
        tags: idea.tags,
      });
    }
    fetchData();
  };

  // Folder handlers
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedAccountId) return;

    try {
      await ideaFolderService.create({
        accountId: selectedAccountId,
        name: newFolderName.trim(),
      });
      toast.success("Folder created");
      setNewFolderName("");
      setIsFolderDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to create folder");
    }
  };

  const handleUpdateFolder = async () => {
    if (!newFolderName.trim() || !editingFolder) return;

    try {
      await ideaFolderService.update(editingFolder.id, {
        name: newFolderName.trim(),
      });
      toast.success("Folder updated");
      setNewFolderName("");
      setEditingFolder(null);
      setIsFolderDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to update folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure? Ideas in this folder will be moved to Uncategorized.")) return;

    try {
      await ideaFolderService.delete(folderId);
      toast.success("Folder deleted");
      if (folderFilter === folderId) {
        setFolderFilter("all");
      }
      fetchData();
    } catch (error) {
      toast.error("Failed to delete folder");
    }
  };

  const filteredIdeas = ideas.filter((idea) => {
    // Folder filter
    if (folderFilter === "uncategorized" && idea.folderId !== null) return false;
    if (folderFilter !== "all" && folderFilter !== "uncategorized" && idea.folderId !== folderFilter) return false;

    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      idea.title.toLowerCase().includes(query) ||
      idea.description?.toLowerCase().includes(query) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Get folder name helper
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "Uncategorized";
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "Unknown";
  };

  // Count ideas per folder
  const uncategorizedCount = ideas.filter((i) => !i.folderId).length;

  const renderStars = (priority: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3 w-3",
          i < priority
            ? "fill-primary text-primary"
            : "text-muted-foreground"
        )}
      />
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-subsection text-foreground">Idea Bank</h1>
          <p className="text-muted-foreground mt-1">
            Store and organize your content ideas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingFolder(null);
              setNewFolderName("");
              setIsFolderDialogOpen(true);
            }}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            onClick={() => {
              setEditingIdea(null);
              setIsDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Idea
          </Button>
        </div>
      </div>

      {/* Folders Sidebar + Content */}
      <div className="flex gap-6">
        {/* Folders Sidebar */}
        <div className="w-64 shrink-0">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Folders
              </h3>
              <div className="space-y-1">
                {/* All Ideas */}
                <button
                  onClick={() => setFolderFilter("all")}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    folderFilter === "all"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    All Ideas
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {ideas.length}
                  </Badge>
                </button>

                {/* Uncategorized */}
                <button
                  onClick={() => setFolderFilter("uncategorized")}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    folderFilter === "uncategorized"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Uncategorized
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {uncategorizedCount}
                  </Badge>
                </button>

                {/* Separator */}
                {folders.length > 0 && (
                  <div className="border-t my-2" />
                )}

                {/* User Folders */}
                {folders.map((folder) => {
                  const count = ideas.filter((i) => i.folderId === folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        folderFilter === folder.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <button
                        onClick={() => setFolderFilter(folder.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <Folder className="h-4 w-4" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingFolder(folder);
                                setNewFolderName(folder.name);
                                setIsFolderDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search ideas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredIdeas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start capturing your content ideas to never forget a great concept!
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Idea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {renderStars(idea.priority)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(idea)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>

                          {/* Move to folder submenu */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleMoveToFolder(idea.id, null)}
                            disabled={!idea.folderId}
                          >
                            <Folder className="h-4 w-4 mr-2" />
                            Uncategorized
                          </DropdownMenuItem>
                          {folders.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={() => handleMoveToFolder(idea.id, folder.id)}
                              disabled={idea.folderId === folder.id}
                            >
                              <Folder className="h-4 w-4 mr-2" />
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(idea.id, "in_progress")}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Move to Calendar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(idea.id, "archived")}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(idea.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold mb-2">{idea.title}</h3>
                    {idea.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {idea.description}
                      </p>
                    )}

                    {/* Folder indicator */}
                    {idea.folderId && (
                      <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                        <Folder className="h-3 w-3" />
                        {getFolderName(idea.folderId)}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {idea.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {idea.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{idea.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <Badge
                        className={cn(
                          "text-xs text-white",
                          statusColors[idea.status]
                        )}
                      >
                        {statusLabels[idea.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

        </div>
      </div>

      {/* Idea Dialog */}
      <IdeaDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingIdea(null);
        }}
        accountId={selectedAccountId}
        idea={editingIdea}
        onSuccess={handleIdeaSaved}
      />

      {/* Folder Dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? "Rename Folder" : "Create New Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  editingFolder ? handleUpdateFolder() : handleCreateFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFolderDialogOpen(false);
                setEditingFolder(null);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              {editingFolder ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
