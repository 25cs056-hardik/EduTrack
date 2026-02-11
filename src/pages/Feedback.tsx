import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Star,
  CheckCircle2,
  Clock,
  Filter,
  ThumbsUp,
  Reply,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Feedback {
  id: string;
  projectTitle: string;
  taskTitle?: string;
  type: "review" | "comment" | "suggestion";
  status: "pending" | "addressed" | "acknowledged";
  content: string;
  mentor: { name: string; avatar?: string };
  student: { name: string; avatar?: string };
  createdAt: string;
  rating?: number;
  replies?: { author: string; content: string; createdAt: string }[];
}

const feedbackData: Feedback[] = [
  {
    id: "1",
    projectTitle: "E-Commerce Platform Development",
    taskTitle: "Implement user authentication",
    type: "review",
    status: "pending",
    content:
      "Great progress on the authentication module! The JWT implementation is solid. Consider adding rate limiting to prevent brute force attacks. Also, please add input validation for email and password fields.",
    mentor: { name: "Dr. Sarah Wilson" },
    student: { name: "John Doe" },
    createdAt: "2 hours ago",
    rating: 4,
    replies: [
      {
        author: "John Doe",
        content: "Thank you for the feedback! I'll add rate limiting using express-rate-limit.",
        createdAt: "1 hour ago",
      },
    ],
  },
  {
    id: "2",
    projectTitle: "Machine Learning Research Paper",
    type: "suggestion",
    status: "acknowledged",
    content:
      "The literature review section needs more recent references (2022-2024). I recommend including papers from NeurIPS and ICML conferences. The methodology section is well-structured.",
    mentor: { name: "Prof. Michael Chen" },
    student: { name: "John Doe" },
    createdAt: "1 day ago",
    rating: 3,
  },
  {
    id: "3",
    projectTitle: "E-Commerce Platform Development",
    taskTitle: "Design dashboard wireframes",
    type: "comment",
    status: "addressed",
    content:
      "The wireframes look clean and professional. The user flow is intuitive. Approved for development phase.",
    mentor: { name: "Dr. Sarah Wilson" },
    student: { name: "John Doe" },
    createdAt: "3 days ago",
    rating: 5,
  },
  {
    id: "4",
    projectTitle: "Mobile App for Campus Events",
    type: "review",
    status: "pending",
    content:
      "The app architecture is well-designed. However, I noticed some memory leaks in the event list component. Please review the useEffect cleanup functions. Also, consider implementing pagination for better performance.",
    mentor: { name: "Dr. Emily Brown" },
    student: { name: "John Doe" },
    createdAt: "4 days ago",
    rating: 3,
  },
];

const statusConfig = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  addressed: { label: "Addressed", className: "bg-success/10 text-success border-success/20" },
  acknowledged: { label: "Acknowledged", className: "bg-info/10 text-info border-info/20" },
};

const typeConfig = {
  review: { label: "Review", className: "bg-primary/10 text-primary" },
  comment: { label: "Comment", className: "bg-muted text-muted-foreground" },
  suggestion: { label: "Suggestion", className: "bg-accent/10 text-accent" },
};

export default function Feedback() {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(feedbackData[0]);
  const [replyContent, setReplyContent] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredFeedback = feedbackData.filter(
    (f) => filterStatus === "all" || f.status === filterStatus
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout userRole="mentor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mentor Feedback</h1>
            <p className="text-muted-foreground mt-1">
              Review and respond to project feedback from mentors
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="addressed">Addressed</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-foreground">
                    {feedbackData.filter((f) => f.status === "pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Addressed</p>
                  <p className="text-2xl font-bold text-foreground">
                    {feedbackData.filter((f) => f.status === "addressed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold text-foreground">{feedbackData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List & Detail */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Feedback List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredFeedback.map((feedback) => (
              <div
                key={feedback.id}
                onClick={() => setSelectedFeedback(feedback)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all duration-200",
                  selectedFeedback?.id === feedback.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={feedback.mentor.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {feedback.mentor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm truncate">
                        {feedback.mentor.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", statusConfig[feedback.status].className)}
                      >
                        {statusConfig[feedback.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground line-clamp-1 font-medium">
                      {feedback.projectTitle}
                    </p>
                    {feedback.taskTitle && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Task: {feedback.taskTitle}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {feedback.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{feedback.createdAt}</span>
                      {feedback.rating && renderStars(feedback.rating)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback Detail */}
          <div className="lg:col-span-3">
            {selectedFeedback ? (
              <Card className="h-fit">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedFeedback.mentor.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {selectedFeedback.mentor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedFeedback.mentor.name}</CardTitle>
                        <CardDescription>{selectedFeedback.createdAt}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={typeConfig[selectedFeedback.type].className}>
                        {typeConfig[selectedFeedback.type].label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={statusConfig[selectedFeedback.status].className}
                      >
                        {statusConfig[selectedFeedback.status].label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Info */}
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="font-medium text-foreground">{selectedFeedback.projectTitle}</p>
                    {selectedFeedback.taskTitle && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Task: {selectedFeedback.taskTitle}
                      </p>
                    )}
                    {selectedFeedback.rating && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        {renderStars(selectedFeedback.rating)}
                      </div>
                    )}
                  </div>

                  {/* Feedback Content */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Feedback</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedFeedback.content}
                    </p>
                  </div>

                  {/* Replies */}
                  {selectedFeedback.replies && selectedFeedback.replies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Replies</h4>
                      <div className="space-y-3">
                        {selectedFeedback.replies.map((reply, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-accent/10 text-accent text-xs">
                                {reply.author
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-foreground">
                                  {reply.author}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {reply.createdAt}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply Input */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          Acknowledge
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Addressed
                        </Button>
                      </div>
                      <Button variant="gradient" size="sm" className="gap-1">
                        <Send className="h-4 w-4" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a feedback item to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}