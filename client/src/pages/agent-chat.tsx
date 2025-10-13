import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send, Brain, Loader2, Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Agent, Conversation, Message, AgentMemory } from "@shared/schema";
import { format } from "date-fns";

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.id as string;
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agent } = useQuery<Agent>({
    queryKey: ["/api/agents", agentId],
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/agents", agentId, "conversations"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
  });

  const { data: memory = [] } = useQuery<AgentMemory[]>({
    queryKey: ["/api/agents", agentId, "memory"],
    enabled: agent?.enableMemory === true,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/agents/${agentId}/conversations`, { 
        title: `Conversation ${conversations.length + 1}` 
      });
      return await response.json();
    },
    onSuccess: (data: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "conversations"] });
      setSelectedConversation(data.id);
      toast({
        title: "Conversation created",
        description: "New conversation started",
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiRequest("DELETE", `/api/conversations/${conversationId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "conversations"] });
      setSelectedConversation(null);
      toast({
        title: "Conversation deleted",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      const response = await apiRequest("POST", `/api/conversations/${selectedConversation}/chat`, { message });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "memory"] });
      setInput("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !selectedConversation) return;
    chatMutation.mutate(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!agent) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/agents">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">{agent.description || "AI Assistant"}</p>
        </div>
        <Button onClick={() => createConversationMutation.mutate()} data-testid="button-new-conversation">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">Conversations</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg hover-elevate transition-colors cursor-pointer group ${
                    selectedConversation === conversation.id ? "bg-accent" : ""
                  }`}
                  data-testid={`conversation-${conversation.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conversation.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conversation.updatedAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this conversation?")) {
                          deleteConversationMutation.mutate(conversation.id);
                        }
                      }}
                      data-testid={`button-delete-conversation-${conversation.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              {agent.enableMemory && (
                <TabsTrigger value="memory">
                  <Brain className="w-4 h-4 mr-2" />
                  Memory ({memory.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
              {selectedConversation ? (
                <>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 max-w-3xl mx-auto">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Start a conversation with {agent.name}</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            data-testid={`message-${message.id}`}
                          >
                            <Card
                              className={`max-w-[80%] ${
                                message.role === "user" ? "bg-primary text-primary-foreground" : ""
                              }`}
                            >
                              <CardContent className="p-3">
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                {message.metadata?.toolsUsed && message.metadata.toolsUsed.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {message.metadata.toolsUsed.map((tool: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {tool}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <p className="text-xs opacity-70 mt-1">
                                  {format(new Date(message.createdAt), "h:mm a")}
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t">
                    <div className="flex gap-2 max-w-3xl mx-auto">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="min-h-[60px] resize-none"
                        disabled={chatMutation.isPending}
                        data-testid="textarea-message"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || chatMutation.isPending}
                        size="icon"
                        className="h-[60px] w-[60px]"
                        data-testid="button-send"
                      >
                        {chatMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="mb-4">No conversation selected</p>
                    <Button onClick={() => createConversationMutation.mutate()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="memory" className="flex-1 overflow-auto mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3 max-w-3xl mx-auto">
                  {memory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No memory entries yet</p>
                      <p className="text-sm">The agent will learn from conversations</p>
                    </div>
                  ) : (
                    memory.map((item) => (
                      <Card key={item.id} data-testid={`memory-${item.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm font-medium">{item.source || "Learned"}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(item.createdAt), "MMM d")}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{item.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
