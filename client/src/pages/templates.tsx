import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search, Users, MessageSquare, Shield, Zap, TrendingUp } from "lucide-react";
import type { FlowTemplate, InstagramAccount } from "@shared/schema";

const categoryIcons: Record<string, typeof Sparkles> = {
  "auto-reply": MessageSquare,
  "moderation": Shield,
  "engagement": TrendingUp,
  "dm-automation": Zap,
};

export default function Templates() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [flowName, setFlowName] = useState("");

  const { data: templates, isLoading: templatesLoading } = useQuery<FlowTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: accounts } = useQuery<InstagramAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: string; accountId: string; name: string }) => {
      const response = await apiRequest(`/api/templates/${data.templateId}/use`, {
        method: "POST",
        body: JSON.stringify({ accountId: data.accountId, name: data.name }),
      });
      return response;
    },
    onSuccess: (flow: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      toast({
        title: "Flow created from template",
        description: "Your new flow has been created successfully",
      });
      setUseDialogOpen(false);
      setLocation(`/flows/${flow.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create flow from template",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = templates?.reduce((acc, template) => {
    if (!acc.includes(template.category)) {
      acc.push(template.category);
    }
    return acc;
  }, [] as string[]) || [];

  const handleUseTemplate = (template: FlowTemplate) => {
    setSelectedTemplate(template);
    setFlowName(template.name);
    setSelectedAccountId("");
    setUseDialogOpen(true);
  };

  const handleConfirmUse = () => {
    console.log("handleConfirmUse called", { selectedTemplate: selectedTemplate?.id, selectedAccountId, flowName });
    
    if (!selectedTemplate || !selectedAccountId || !flowName) {
      console.error("Missing required fields:", { 
        hasTemplate: !!selectedTemplate, 
        hasAccountId: !!selectedAccountId, 
        hasFlowName: !!flowName 
      });
      toast({
        title: "Missing information",
        description: "Please select an account and enter a flow name",
        variant: "destructive",
      });
      return;
    }

    console.log("Submitting template use mutation");
    useTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      accountId: selectedAccountId,
      name: flowName,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Flow Templates</h1>
        <p className="text-muted-foreground">
          Get started quickly with pre-built automation templates
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-templates"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Templates</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} data-testid={`tab-${category}`}>
              {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {templatesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6 space-y-3">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredTemplates && filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = categoryIcons[template.category] || Sparkles;
            return (
              <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {parseInt(template.useCount) || 0} uses
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {template.nodes.length} nodes
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => handleUseTemplate(template)} 
                    className="w-full"
                    data-testid={`button-use-template-${template.id}`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your filters" 
                  : "Templates will appear here"}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Flow from Template</DialogTitle>
            <DialogDescription>
              Configure your new flow based on "{selectedTemplate?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account">Instagram Account</Label>
              <Select value={selectedAccountId} onValueChange={(value) => {
                console.log("Account selected:", value);
                setSelectedAccountId(value);
              }}>
                <SelectTrigger id="account" data-testid="select-account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      @{account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flowName">Flow Name</Label>
              <Input
                id="flowName"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Enter flow name"
                data-testid="input-flow-name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUseDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmUse} 
              disabled={!selectedAccountId || !flowName || useTemplateMutation.isPending}
              data-testid="button-create-flow"
            >
              {useTemplateMutation.isPending ? "Creating..." : "Create Flow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
