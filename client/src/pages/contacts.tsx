import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, User } from "lucide-react";
import type { Contact, InstagramAccount } from "@shared/schema";

export default function Contacts() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [newContact, setNewContact] = useState({
    accountId: "",
    instagramUserId: "",
    username: "",
  });

  const { data: accounts = [] } = useQuery<InstagramAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts", selectedAccountId],
    queryFn: () => 
      selectedAccountId && selectedAccountId !== "all"
        ? fetch(`/api/contacts?accountId=${selectedAccountId}`).then(r => r.json())
        : fetch("/api/contacts").then(r => r.json()),
  });

  const createContactMutation = useMutation({
    mutationFn: (contact: typeof newContact) => 
      apiRequest("/api/contacts", "POST", contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setIsAddDialogOpen(false);
      setNewContact({ accountId: "", instagramUserId: "", username: "" });
      toast({
        title: "Contact added",
        description: "The contact has been added successfully.",
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

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => 
      apiRequest(`/api/contacts/${contactId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact deleted",
        description: "The contact has been deleted successfully.",
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

  const handleAddContact = () => {
    if (!newContact.accountId || !newContact.instagramUserId || !newContact.username) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createContactMutation.mutate(newContact);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-[#E4405F] to-[#833AB4] text-transparent bg-clip-text">
            Contacts
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-2">
            Manage Instagram user contacts with their user IDs
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto" data-testid="button-add-contact">
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-add-contact">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Add a new Instagram user contact with their user ID and username
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-account">Instagram Account</Label>
                <Select
                  value={newContact.accountId}
                  onValueChange={(value) => setNewContact({ ...newContact, accountId: value })}
                >
                  <SelectTrigger id="contact-account" data-testid="select-contact-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        @{account.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-user-id">Instagram User ID</Label>
                <Input
                  id="contact-user-id"
                  placeholder="e.g., 17841401508982730"
                  value={newContact.instagramUserId}
                  onChange={(e) => setNewContact({ ...newContact, instagramUserId: e.target.value })}
                  data-testid="input-contact-user-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-username">Username</Label>
                <Input
                  id="contact-username"
                  placeholder="e.g., johndoe"
                  value={newContact.username}
                  onChange={(e) => setNewContact({ ...newContact, username: e.target.value })}
                  data-testid="input-contact-username"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddContact} 
                disabled={createContactMutation.isPending}
                data-testid="button-save-contact"
              >
                {createContactMutation.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact List</CardTitle>
              <CardDescription>
                All saved Instagram user contacts
              </CardDescription>
            </div>
            <div className="w-64">
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger data-testid="select-filter-account">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      @{account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading contacts...
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No contacts found. Add your first contact to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Instagram User ID</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const account = accounts.find(a => a.id === contact.accountId);
                  return (
                    <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                      <TableCell className="font-medium">
                        @{contact.username}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {contact.instagramUserId}
                      </TableCell>
                      <TableCell>
                        {account ? `@${account.username}` : "Unknown"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteContactMutation.mutate(contact.id)}
                          disabled={deleteContactMutation.isPending}
                          data-testid={`button-delete-contact-${contact.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
