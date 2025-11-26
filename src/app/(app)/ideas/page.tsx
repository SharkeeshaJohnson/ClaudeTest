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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { IdeaDialog } from "@/components/ideas/idea-dialog";
import { toast } from "sonner";

interface Idea {
  id: string;
  accountId: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  tags: string[];
  createdAt: string;
  account: {
    id: string;
    type: string;
    name: string;
  };
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const isAiJourney = selectedAccount?.type === "ai_journey";

  const fetchIdeas = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);
    try {
      let url = `/api/ideas?accountId=${selectedAccountId}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (priorityFilter !== "all") url += `&priority=${priorityFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data);
      }
    } catch (error) {
      console.error("Failed to fetch ideas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleUpdateStatus = async (ideaId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("Idea updated");
        fetchIdeas();
      }
    } catch (error) {
      toast.error("Failed to update idea");
    }
  };

  const handleDelete = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;

    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Idea deleted");
        fetchIdeas();
      }
    } catch (error) {
      toast.error("Failed to delete idea");
    }
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setIsDialogOpen(true);
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      idea.title.toLowerCase().includes(query) ||
      idea.description?.toLowerCase().includes(query) ||
      idea.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const renderStars = (priority: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3 w-3",
          i < priority
            ? isAiJourney
              ? "fill-blue-500 text-blue-500"
              : "fill-orange-500 text-orange-500"
            : "text-muted-foreground"
        )}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Idea Bank</h1>
          <p className="text-muted-foreground">
            Store and organize your content ideas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingIdea(null);
            setIsDialogOpen(true);
          }}
          className={cn(
            isAiJourney
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-orange-500 hover:bg-orange-600"
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Idea
        </Button>
      </div>

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
              className={cn(
                isAiJourney
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-orange-500 hover:bg-orange-600"
              )}
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

      {/* Idea Dialog */}
      <IdeaDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingIdea(null);
        }}
        accountId={selectedAccountId}
        idea={editingIdea}
        onSuccess={fetchIdeas}
      />
    </div>
  );
}
