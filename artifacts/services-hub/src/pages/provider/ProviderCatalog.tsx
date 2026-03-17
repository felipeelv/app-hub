import { useState } from "react";
import { useListProviderCatalog, useCreateCatalogItem } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";

const emptyForm = { name: "", description: "", category: "", estimatedDays: "", basePrice: "", isAvailable: true, regions: "" };

export function ProviderCatalog() {
  const { data: items = [], refetch } = useListProviderCatalog();
  const createItem = useCreateCatalogItem();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleSave = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays) : undefined,
      basePrice: parseFloat(form.basePrice),
      isAvailable: form.isAvailable,
      regions: form.regions ? form.regions.split(",").map((r) => r.trim()) : [],
    };
    try {
      await createItem.mutateAsync({ data: payload });
      toast({ title: "Service created successfully!" });
      setOpen(false);
      setForm(emptyForm);
      refetch();
    } catch {
      toast({ title: "Error", description: "Could not save the service.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Service Catalog</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(emptyForm)}>
              <PlusCircle className="h-4 w-4 mr-1" /> New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Service Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Category *</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. HVAC, Electrical, Painting..." /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Base Price ($) *</Label><Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></div>
                <div><Label>Estimated Days</Label><Input type="number" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} /></div>
              </div>
              <div><Label>Service Areas (comma-separated)</Label><Input value={form.regions} onChange={(e) => setForm({ ...form, regions: e.target.value })} placeholder="Orlando, Kissimmee, Sanford..." /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
                <Label>Available for booking</Label>
              </div>
              <Button onClick={handleSave} disabled={!form.name || !form.category || !form.basePrice} className="w-full">Save Service</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Base Price</TableHead>
              <TableHead>Est. Days</TableHead>
              <TableHead>Service Areas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No services listed yet. Click "New Service" to get started.</TableCell></TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="font-medium">{item.name}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
                </TableCell>
                <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.basePrice)}</TableCell>
                <TableCell>{item.estimatedDays ? `${item.estimatedDays} day(s)` : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.regions?.join(", ") || "—"}</TableCell>
                <TableCell>
                  <Badge variant={item.isAvailable ? "default" : "secondary"}>{item.isAvailable ? "Available" : "Unavailable"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
