import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bot, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import type { AgentTemplate } from "@shared/schema";

export default function AgentTemplatesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: templates = [], isLoading } = useQuery<AgentTemplate[]>({
    queryKey: ['/api/agent-templates'],
  });

  const createFromTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest("POST", `/api/agents/from-template/${templateId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Agent created!",
        description: "Your AI agent has been created from the template.",
      });
      setLocation('/agents');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create agent from template",
        variant: "destructive",
      });
    },
  });

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "customer-support", label: "Customer Support" },
    { id: "lead-qualification", label: "Lead Qualification" },
    { id: "faq", label: "FAQ" },
    { id: "sales", label: "Sales" },
    { id: "scheduling", label: "Scheduling" },
  ];

  const filteredTemplates = selectedCategory === "all"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "customer-support": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "lead-qualification": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "faq": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "sales": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      "scheduling": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    };
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Agent Templates</h1>
        </div>
        <p className="text-muted-foreground">
          Choose from pre-built AI agents designed for common business use cases. Click "Use Template" to create your own customized agent.
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              data-testid={`tab-${category.id}`}
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground text-center">
              {selectedCategory === "all"
                ? "No agent templates available yet."
                : `No templates found in the ${categories.find(c => c.id === selectedCategory)?.label} category.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col" data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-4xl">{template.icon}</div>
                  <Badge className={getCategoryColor(template.category)} data-testid={`badge-category-${template.id}`}>
                    {template.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Badge>
                </div>
                <CardTitle className="text-xl" data-testid={`title-${template.id}`}>{template.name}</CardTitle>
                <CardDescription data-testid={`description-${template.id}`}>
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{template.model}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {template.enableMemory && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Memory
                      </Badge>
                    )}
                    {template.enableTools && template.tools.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {template.tools.length} Tools
                      </Badge>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Used {template.useCount} times
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => createFromTemplate.mutate(template.id)}
                  disabled={createFromTemplate.isPending}
                  data-testid={`button-use-template-${template.id}`}
                >
                  {createFromTemplate.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Use Template
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
