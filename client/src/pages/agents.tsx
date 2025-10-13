import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Bot, MessageSquare, Brain, Trash2, Settings, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Agent } from "@shared/schema";
import { Link } from "wouter";

const agentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  model: z.string().default("gemini-2.5-flash"),
  systemPrompt: z.string().min(10, "System prompt must be at least 10 characters"),
  temperature: z.string().default("0.7"),
  maxTokens: z.string().default("8192"),
  enableMemory: z.boolean().default(true),
  enableTools: z.boolean().default(true),
  tools: z.array(z.string()).default([]),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

export default function AgentsPage() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: availableTools = [] } = useQuery<Array<{ name: string; details: any }>>({
    queryKey: ["/api/agents/tools/available"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: AgentFormValues) => {
      const response = await apiRequest("POST", "/api/agents", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setCreateDialogOpen(false);
      toast({
        title: "Agent created",
        description: "Your AI agent has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/agents/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent deleted",
        description: "Agent has been deleted successfully",
      });
    },
  });

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      model: "gemini-2.5-flash",
      systemPrompt: "",
      temperature: "0.7",
      maxTokens: "8192",
      enableMemory: true,
      enableTools: true,
      tools: [],
    },
  });

  const onSubmit = (data: AgentFormValues) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage intelligent AI agents with memory and tools
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/agent-templates">
            <Button variant="outline" data-testid="button-browse-templates">
              <Library className="w-4 h-4 mr-2" />
              Browse Templates
            </Button>
          </Link>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-agent">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create AI Agent</DialogTitle>
                <DialogDescription>
                  Configure your AI agent with custom personality, memory, and tools
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My AI Assistant" {...field} data-testid="input-agent-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="What does this agent do?" {...field} data-testid="input-agent-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-agent-model">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</SelectItem>
                          <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="You are a helpful AI assistant specialized in..."
                          className="min-h-24"
                          {...field}
                          data-testid="textarea-system-prompt"
                        />
                      </FormControl>
                      <FormDescription>
                        Define the agent's personality, role, and behavior
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0" max="2" {...field} data-testid="input-temperature" />
                        </FormControl>
                        <FormDescription>0 = Focused, 2 = Creative</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-max-tokens" />
                        </FormControl>
                        <FormDescription>Response length limit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="enableMemory"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Memory (RAG)</FormLabel>
                        <FormDescription>
                          Agent can remember and learn from conversations
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-enable-memory" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableTools"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Tools</FormLabel>
                        <FormDescription>
                          Agent can use tools to perform actions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-enable-tools" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("enableTools") && (
                  <FormField
                    control={form.control}
                    name="tools"
                    render={() => (
                      <FormItem>
                        <FormLabel>Available Tools</FormLabel>
                        <div className="space-y-2">
                          {availableTools.map((tool) => (
                            <FormField
                              key={tool.name}
                              control={form.control}
                              name="tools"
                              render={({ field }) => (
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(tool.name)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, tool.name])
                                          : field.onChange(field.value?.filter((value) => value !== tool.name));
                                      }}
                                      data-testid={`checkbox-tool-${tool.name}`}
                                    />
                                  </FormControl>
                                  <div className="flex-1">
                                    <FormLabel className="font-normal">{tool.name}</FormLabel>
                                    <p className="text-sm text-muted-foreground">{tool.details?.description}</p>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                      {createMutation.isPending ? "Creating..." : "Create Agent"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {agents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first AI agent to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-agent">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover-elevate" data-testid={`card-agent-${agent.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        {agent.description && (
                          <CardDescription className="mt-1">{agent.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{agent.model}</Badge>
                    {agent.enableMemory && (
                      <Badge variant="outline">
                        <Brain className="w-3 h-3 mr-1" />
                        Memory
                      </Badge>
                    )}
                    {agent.enableTools && agent.tools.length > 0 && (
                      <Badge variant="outline">
                        <Settings className="w-3 h-3 mr-1" />
                        {agent.tools.length} Tools
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="default" size="sm" className="flex-1" data-testid={`button-chat-${agent.id}`}>
                      <Link href={`/agents/${agent.id}/chat`}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this agent?")) {
                          deleteMutation.mutate(agent.id);
                        }
                      }}
                      data-testid={`button-delete-${agent.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
